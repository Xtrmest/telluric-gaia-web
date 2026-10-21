from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import logging
import secrets
import base64
import asyncio
from datetime import datetime, timezone, timedelta
from typing import List, Optional

import bcrypt
import jwt
import httpx
import requests
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Query, Header
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

# ----------------------------------------------------------------------------
# DB + App setup
# ----------------------------------------------------------------------------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Telluric Gaia Apparel Lab API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("telluric")

JWT_ALGORITHM = "HS256"
EMERGENT_SESSION_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


# ----------------------------------------------------------------------------
# Auth helpers
# ----------------------------------------------------------------------------
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email,
               "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def set_jwt_cookie(response: Response, token: str):
    response.set_cookie(key="access_token", value=token, httponly=True, secure=True,
                        samesite="none", max_age=604800, path="/")


def set_session_cookie(response: Response, token: str):
    response.set_cookie(key="session_token", value=token, httponly=True, secure=True,
                        samesite="none", max_age=604800, path="/")


def public_user(doc: dict) -> dict:
    return {
        "user_id": doc["user_id"],
        "email": doc["email"],
        "name": doc.get("name", ""),
        "picture": doc.get("picture"),
        "role": doc.get("role", "customer"),
        "auth_provider": doc.get("auth_provider", "password"),
    }


async def resolve_token_user(token: str) -> Optional[dict]:
    # Try Google session token first
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if session:
        expires_at = session.get("expires_at")
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at and expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at and expires_at >= datetime.now(timezone.utc):
            user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
            if user:
                return user
    # Try JWT access token
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") == "access":
            user = await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0})
            if user:
                return user
    except jwt.PyJWTError:
        pass
    return None


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("session_token") or request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = await resolve_token_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    return user


async def get_optional_user(request: Request) -> Optional[dict]:
    try:
        return await get_current_user(request)
    except HTTPException:
        return None


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# ----------------------------------------------------------------------------
# Models
# ----------------------------------------------------------------------------
class RegisterInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1)


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class Composition(BaseModel):
    material: str
    percent: float


class TechPack(BaseModel):
    chest: Optional[str] = None
    sleeve: Optional[str] = None
    length: Optional[str] = None
    fiber_density: Optional[str] = None
    tensile_strength: Optional[str] = None
    weight_gsm: Optional[str] = None


class ProductInput(BaseModel):
    name: str
    description: str
    price: float
    material: str
    category: str = "Apparel"
    sizes: List[str] = ["XS", "S", "M", "L", "XL", "XXL"]
    color_palette: str
    images: List[str] = []
    eco_rating: float = 95.0
    carbon_label: str = "Carbon Negative"
    stock: int = 25
    composition: List[Composition] = []
    tech_pack: TechPack = TechPack()
    activation_temp: str = "None"
    is_new: bool = True
    featured: bool = False


class OrderItem(BaseModel):
    product_id: str
    name: str
    image: Optional[str] = None
    size: str
    color: str
    price: float
    quantity: int


class ShippingInfo(BaseModel):
    full_name: str
    email: EmailStr
    address: str
    city: str
    postal_code: str
    country: str


class OrderInput(BaseModel):
    items: List[OrderItem]
    shipping: ShippingInfo
    shipping_tier: str = "Standard Eco"
    shipping_cost: float = 0.0
    subtotal: float
    total: float


# ----------------------------------------------------------------------------
# Auth endpoints
# ----------------------------------------------------------------------------
@api_router.post("/auth/register")
async def register(payload: RegisterInput, response: Response):
    email = payload.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    doc = {
        "user_id": user_id, "email": email, "name": payload.name,
        "password_hash": hash_password(payload.password), "role": "customer",
        "auth_provider": "password", "picture": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)
    token = create_access_token(user_id, email)
    set_jwt_cookie(response, token)
    return {"user": public_user(doc), "token": token}


@api_router.post("/auth/login")
async def login(payload: LoginInput, response: Response):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not user.get("password_hash") or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["user_id"], email)
    set_jwt_cookie(response, token)
    return {"user": public_user(user), "token": token}


@api_router.post("/auth/google-session")
async def google_session(request: Request, response: Response):
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session id")
    async with httpx.AsyncClient() as http:
        resp = await http.get(EMERGENT_SESSION_URL, headers={"X-Session-ID": session_id}, timeout=15)
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Failed to verify Google session")
    data = resp.json()
    if not data.get("email") or not data.get("session_token"):
        raise HTTPException(status_code=401, detail="Invalid Google session response")
    email = data["email"].lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"user_id": user_id},
                                  {"$set": {"name": data.get("name", existing.get("name")),
                                            "picture": data.get("picture")}})
        user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id, "email": email, "name": data.get("name", ""),
            "picture": data.get("picture"), "role": "customer", "auth_provider": "google",
            "password_hash": None, "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(dict(user_doc))
    session_token = data["session_token"]
    await db.user_sessions.insert_one({
        "user_id": user_id, "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    set_session_cookie(response, session_token)
    return {"user": public_user(user_doc), "token": session_token}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return {"user": public_user(user)}


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("session_token", path="/")
    return {"success": True}


# ----------------------------------------------------------------------------
# Product endpoints
# ----------------------------------------------------------------------------
@api_router.get("/products")
async def list_products(
    material: Optional[str] = None,
    size: Optional[str] = None,
    palette: Optional[str] = None,
    search: Optional[str] = None,
    is_new: Optional[bool] = None,
    featured: Optional[bool] = None,
    sort: str = "newest",
):
    q: dict = {}
    if material:
        q["material"] = material
    if palette:
        q["color_palette"] = palette
    if size:
        q["sizes"] = size
    if is_new is not None:
        q["is_new"] = is_new
    if featured is not None:
        q["featured"] = featured
    if search:
        q["$or"] = [{"name": {"$regex": search, "$options": "i"}},
                    {"description": {"$regex": search, "$options": "i"}}]
    sort_map = {
        "price_asc": [("price", 1)],
        "price_desc": [("price", -1)],
        "eco": [("eco_rating", -1)],
        "newest": [("created_at", -1)],
    }
    cursor = db.products.find(q, {"_id": 0}).sort(sort_map.get(sort, [("created_at", -1)]))
    return await cursor.to_list(200)


@api_router.get("/products/meta/filters")
async def product_filters():
    return {
        "materials": ["Hemp Canvas", "Bamboo Micro-Knit", "Recycled Bio-Polymer", "Organic Bio-Fleece"],
        "sizes": ["XS", "S", "M", "L", "XL", "XXL"],
        "palettes": ["Cold Cyan", "Ember Amber", "Bio Olive", "Void Black"],
    }


@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@api_router.post("/products")
async def create_product(payload: ProductInput, admin: dict = Depends(require_admin)):
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.products.insert_one(dict(doc))
    doc.pop("_id", None)
    return doc


@api_router.put("/products/{product_id}")
async def update_product(product_id: str, payload: ProductInput, admin: dict = Depends(require_admin)):
    existing = await db.products.find_one({"id": product_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    doc = payload.model_dump()
    await db.products.update_one({"id": product_id}, {"$set": doc})
    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    return updated


@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, admin: dict = Depends(require_admin)):
    res = await db.products.delete_one({"id": product_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"success": True}


# ----------------------------------------------------------------------------
# Order endpoints
# ----------------------------------------------------------------------------
@api_router.post("/orders")
async def create_order(payload: OrderInput, request: Request):
    user = await get_optional_user(request)

    # Inventory sync: validate stock, then decrement.
    shortages = []
    adjustments = []
    for item in payload.items:
        product = await db.products.find_one({"id": item.product_id}, {"_id": 0})
        if not product:
            continue
        if product.get("stock", 0) < item.quantity:
            shortages.append(f"{item.name} ({product.get('stock', 0)} left)")
        else:
            adjustments.append((item.product_id, item.quantity))
    if shortages:
        raise HTTPException(status_code=400, detail="Insufficient stock for: " + ", ".join(shortages))
    for product_id, qty in adjustments:
        await db.products.update_one({"id": product_id}, {"$inc": {"stock": -qty}})

    order_id = str(uuid.uuid4())
    tracking_hash = "TG-" + secrets.token_hex(6).upper()
    doc = payload.model_dump()
    doc.update({
        "id": order_id,
        "tracking_hash": tracking_hash,
        "status": "confirmed",
        "user_id": user["user_id"] if user else None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    await db.orders.insert_one(dict(doc))
    doc.pop("_id", None)
    return doc


@api_router.get("/orders")
async def list_orders(user: dict = Depends(get_current_user)):
    if user.get("role") == "admin":
        cursor = db.orders.find({}, {"_id": 0}).sort([("created_at", -1)])
    else:
        cursor = db.orders.find({"user_id": user["user_id"]}, {"_id": 0}).sort([("created_at", -1)])
    return await cursor.to_list(200)


@api_router.get("/orders/{order_id}")
async def get_order(order_id: str):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


# ----------------------------------------------------------------------------
# PayPal payments (REST Orders v2)
# ----------------------------------------------------------------------------
PAYPAL_MODE = os.environ.get("PAYPAL_MODE", "sandbox")
PAYPAL_CLIENT_ID = os.environ.get("PAYPAL_CLIENT_ID", "")
PAYPAL_SECRET = os.environ.get("PAYPAL_SECRET", "")
PAYPAL_BASE = "https://api-m.paypal.com" if PAYPAL_MODE == "live" else "https://api-m.sandbox.paypal.com"


def paypal_configured() -> bool:
    return bool(PAYPAL_CLIENT_ID and PAYPAL_SECRET)


async def paypal_access_token() -> str:
    async with httpx.AsyncClient() as http:
        r = await http.post(
            f"{PAYPAL_BASE}/v1/oauth2/token",
            auth=(PAYPAL_CLIENT_ID, PAYPAL_SECRET),
            data={"grant_type": "client_credentials"},
            headers={"Accept": "application/json"},
            timeout=30,
        )
    if r.status_code != 200:
        logger.error("PayPal auth failed: %s %s", r.status_code, r.text[:200])
        raise HTTPException(status_code=502, detail="PayPal authentication failed")
    return r.json()["access_token"]


class PayPalCreateInput(BaseModel):
    items: List[OrderItem]
    shipping: ShippingInfo
    shipping_tier: str = "Standard Eco"
    shipping_cost: float = 0.0


@api_router.get("/paypal/config")
async def paypal_config():
    return {"configured": paypal_configured(), "client_id": PAYPAL_CLIENT_ID, "mode": PAYPAL_MODE, "currency": "USD"}


@api_router.post("/paypal/create-order")
async def paypal_create_order(payload: PayPalCreateInput, request: Request):
    if not paypal_configured():
        raise HTTPException(status_code=503, detail="PayPal is not configured yet")
    if not payload.items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    user = await get_optional_user(request)
    subtotal = round(sum(i.price * i.quantity for i in payload.items), 2)
    total = round(subtotal + payload.shipping_cost, 2)
    if total <= 0:
        raise HTTPException(status_code=400, detail="Invalid order total")
    token = await paypal_access_token()
    body = {
        "intent": "CAPTURE",
        "purchase_units": [{
            "amount": {
                "currency_code": "USD", "value": f"{total:.2f}",
                "breakdown": {
                    "item_total": {"currency_code": "USD", "value": f"{subtotal:.2f}"},
                    "shipping": {"currency_code": "USD", "value": f"{payload.shipping_cost:.2f}"},
                },
            },
        }],
    }
    async with httpx.AsyncClient() as http:
        r = await http.post(
            f"{PAYPAL_BASE}/v2/checkout/orders", json=body,
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}, timeout=30,
        )
    if r.status_code not in (200, 201):
        logger.error("PayPal create order failed: %s %s", r.status_code, r.text[:300])
        raise HTTPException(status_code=502, detail="Failed to create PayPal order")
    pp = r.json()
    await db.paypal_pending.insert_one({
        "paypal_order_id": pp["id"],
        "user_id": user["user_id"] if user else None,
        "items": [i.model_dump() for i in payload.items],
        "shipping": payload.shipping.model_dump(),
        "shipping_tier": payload.shipping_tier,
        "shipping_cost": payload.shipping_cost,
        "subtotal": subtotal, "total": total,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"id": pp["id"]}


@api_router.post("/paypal/capture/{paypal_order_id}")
async def paypal_capture(paypal_order_id: str, request: Request):
    if not paypal_configured():
        raise HTTPException(status_code=503, detail="PayPal is not configured yet")
    pending = await db.paypal_pending.find_one({"paypal_order_id": paypal_order_id}, {"_id": 0})
    if not pending:
        raise HTTPException(status_code=404, detail="Pending order not found")
    token = await paypal_access_token()
    async with httpx.AsyncClient() as http:
        r = await http.post(
            f"{PAYPAL_BASE}/v2/checkout/orders/{paypal_order_id}/capture",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}, timeout=30,
        )
    if r.status_code not in (200, 201):
        logger.error("PayPal capture failed: %s %s", r.status_code, r.text[:300])
        raise HTTPException(status_code=502, detail="PayPal capture failed")
    result = r.json()
    if result.get("status") != "COMPLETED":
        raise HTTPException(status_code=400, detail=f"Payment not completed: {result.get('status')}")

    items = [OrderItem(**i) for i in pending["items"]]
    shortages, adjustments = [], []
    for item in items:
        product = await db.products.find_one({"id": item.product_id}, {"_id": 0})
        if not product:
            continue
        if product.get("stock", 0) < item.quantity:
            shortages.append(f"{item.name} ({product.get('stock', 0)} left)")
        else:
            adjustments.append((item.product_id, item.quantity))
    if shortages:
        raise HTTPException(status_code=400, detail="Insufficient stock for: " + ", ".join(shortages))
    for pid, qty in adjustments:
        await db.products.update_one({"id": pid}, {"$inc": {"stock": -qty}})

    user = await get_optional_user(request)
    order_id = str(uuid.uuid4())
    doc = {
        "id": order_id, "tracking_hash": "TG-" + secrets.token_hex(6).upper(), "status": "confirmed",
        "user_id": pending.get("user_id") or (user["user_id"] if user else None),
        "items": pending["items"], "shipping": pending["shipping"],
        "shipping_tier": pending["shipping_tier"], "shipping_cost": pending["shipping_cost"],
        "subtotal": pending["subtotal"], "total": pending["total"],
        "payment_method": "paypal", "payment_status": "paid", "paypal_order_id": paypal_order_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.orders.insert_one(dict(doc))
    await db.paypal_pending.delete_one({"paypal_order_id": paypal_order_id})
    doc.pop("_id", None)
    return doc


# ----------------------------------------------------------------------------
# Virtual Fitting Room — object storage + Nano Banana try-on
# ----------------------------------------------------------------------------
APP_NAME = "telluric-gaia"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
NANO_MODEL = "gemini-3.1-flash-image-preview"
MAX_FRAMES = 12

_STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = _STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
_storage_key = None


def init_storage(force: bool = False):
    global _storage_key
    if _storage_key and not force:
        return _storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    _storage_key = resp.json()["storage_key"]
    return _storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120,
    )
    if resp.status_code == 404:
        key = init_storage(force=True)
        resp = requests.put(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key, "Content-Type": content_type},
            data=data, timeout=120,
        )
    resp.raise_for_status()
    return resp.json()


def get_object(path: str):
    key = init_storage()
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    if resp.status_code == 404:
        key = init_storage(force=True)
        resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "image/png")


def _decode_image(s: str) -> bytes:
    s = s.strip()
    if s.startswith("data:") and "," in s:
        s = s.split(",", 1)[1]
    return base64.b64decode(s)


async def _download_image(url: str) -> bytes:
    async with httpx.AsyncClient(follow_redirects=True) as http:
        r = await http.get(url, timeout=30)
        r.raise_for_status()
        return r.content


async def generate_tryon_image(person_b64: str, garment_b64: str) -> Optional[bytes]:
    chat = LlmChat(
        api_key=EMERGENT_KEY,
        session_id=f"tryon-{uuid.uuid4().hex}",
        system_message="You are a photorealistic virtual clothing try-on image generator.",
    )
    chat.with_model("gemini", NANO_MODEL).with_params(modalities=["image", "text"])
    prompt = (
        "Dress the person in the FIRST image with the garment shown in the SECOND image. "
        "Keep the person's face, hair, body shape, pose, camera angle, framing and background "
        "exactly the same. Only replace their current clothing with the new garment, fitting it "
        "naturally with realistic folds, drape, shadows and lighting. Output one photorealistic "
        "full-body image."
    )
    msg = UserMessage(text=prompt, file_contents=[ImageContent(person_b64), ImageContent(garment_b64)])
    text, images = await chat.send_message_multimodal_response(msg)
    if images:
        return base64.b64decode(images[0]["data"])
    return None


class TryOnModelInput(BaseModel):
    frames: List[str] = Field(min_length=1)
    label: Optional[str] = None


class GenerateInput(BaseModel):
    model_id: str
    product_id: str


def _model_public(doc: dict) -> dict:
    return {
        "id": doc["id"],
        "label": doc.get("label") or "My Model",
        "frame_count": doc["frame_count"],
        "frames": [{"index": f["index"], "url": f"/api/tryon/file/{f['path']}"} for f in sorted(doc["frames"], key=lambda x: x["index"])],
        "created_at": doc["created_at"],
    }


@api_router.post("/tryon/models")
async def create_tryon_model(payload: TryOnModelInput, user: dict = Depends(get_current_user)):
    frames = payload.frames[:MAX_FRAMES]
    model_id = str(uuid.uuid4())
    stored = []
    for i, frame in enumerate(frames):
        try:
            data = _decode_image(frame)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid image data in frames")
        path = f"{APP_NAME}/tryon/{user['user_id']}/models/{model_id}/{i}.png"
        await asyncio.to_thread(put_object, path, data, "image/png")
        stored.append({"index": i, "path": path})
    doc = {
        "id": model_id, "user_id": user["user_id"], "label": payload.label,
        "frames": stored, "frame_count": len(stored),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.tryon_models.insert_one(dict(doc))
    return _model_public(doc)


@api_router.get("/tryon/models")
async def list_tryon_models(user: dict = Depends(get_current_user)):
    cursor = db.tryon_models.find({"user_id": user["user_id"]}, {"_id": 0}).sort([("created_at", -1)])
    docs = await cursor.to_list(50)
    return [_model_public(d) for d in docs]


@api_router.post("/tryon/generate")
async def start_tryon(payload: GenerateInput, user: dict = Depends(get_current_user)):
    model = await db.tryon_models.find_one({"id": payload.model_id, "user_id": user["user_id"]}, {"_id": 0})
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    product = await db.products.find_one({"id": payload.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    frames = sorted(model["frames"], key=lambda x: x["index"])[:MAX_FRAMES]
    job_id = str(uuid.uuid4())
    job = {
        "id": job_id, "user_id": user["user_id"], "model_id": model["id"],
        "product_id": product["id"], "product_name": product["name"],
        "product_image": product["images"][0] if product.get("images") else None,
        "status": "processing", "total": len(frames), "done": 0, "failed": 0,
        "result_frames": [], "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.tryon_jobs.insert_one(dict(job))
    asyncio.create_task(_process_tryon_job(job_id, user["user_id"], frames, product))
    return {"job_id": job_id, "status": "processing", "total": len(frames)}


async def _process_tryon_job(job_id: str, user_id: str, frames: list, product: dict):
    try:
        garment_bytes = await _download_image(product["images"][0])
        garment_b64 = base64.b64encode(garment_bytes).decode()
    except Exception as e:
        logger.error("tryon job %s garment download failed: %s", job_id, e)
        await db.tryon_jobs.update_one({"id": job_id}, {"$set": {"status": "failed"}})
        return

    sem = asyncio.Semaphore(3)

    async def do_frame(i: int, path: str):
        async with sem:
            try:
                person_bytes, _ = await asyncio.to_thread(get_object, path)
                person_b64 = base64.b64encode(person_bytes).decode()
                result = await generate_tryon_image(person_b64, garment_b64)
            except Exception as e:
                logger.error("tryon job %s frame %d failed: %s", job_id, i, str(e)[:200])
                result = None
            if result:
                rpath = f"{APP_NAME}/tryon/{user_id}/results/{job_id}/{i}.png"
                await asyncio.to_thread(put_object, rpath, result, "image/png")
                await db.tryon_jobs.update_one(
                    {"id": job_id},
                    {"$push": {"result_frames": {"index": i, "path": rpath}}, "$inc": {"done": 1}},
                )
            else:
                await db.tryon_jobs.update_one({"id": job_id}, {"$inc": {"done": 1, "failed": 1}})

    await asyncio.gather(*[do_frame(f["index"], f["path"]) for f in frames])
    job = await db.tryon_jobs.find_one({"id": job_id}, {"_id": 0})
    status = "complete" if job and job.get("result_frames") else "failed"
    await db.tryon_jobs.update_one({"id": job_id}, {"$set": {"status": status}})


def _job_public(job: dict) -> dict:
    results = sorted(job.get("result_frames", []), key=lambda x: x["index"])
    return {
        "id": job["id"], "status": job["status"], "total": job["total"],
        "done": job.get("done", 0), "failed": job.get("failed", 0),
        "product_id": job["product_id"], "product_name": job.get("product_name"),
        "product_image": job.get("product_image"), "created_at": job["created_at"],
        "frames": [{"index": r["index"], "url": f"/api/tryon/file/{r['path']}"} for r in results],
    }


@api_router.get("/tryon/jobs/{job_id}")
async def get_tryon_job(job_id: str, user: dict = Depends(get_current_user)):
    job = await db.tryon_jobs.find_one({"id": job_id, "user_id": user["user_id"]}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return _job_public(job)


@api_router.get("/tryon/gallery")
async def tryon_gallery(user: dict = Depends(get_current_user)):
    cursor = db.tryon_jobs.find({"user_id": user["user_id"], "status": "complete"}, {"_id": 0}).sort([("created_at", -1)])
    docs = await cursor.to_list(100)
    return [_job_public(d) for d in docs]


@api_router.delete("/tryon/gallery/{job_id}")
async def delete_tryon_job(job_id: str, user: dict = Depends(get_current_user)):
    res = await db.tryon_jobs.delete_one({"id": job_id, "user_id": user["user_id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"success": True}


@api_router.get("/tryon/file/{path:path}")
async def serve_tryon_file(path: str, request: Request, token: Optional[str] = Query(None)):
    user = await get_optional_user(request)
    if not user and token:
        user = await resolve_token_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    prefix = f"{APP_NAME}/tryon/{user['user_id']}/"
    if not path.startswith(prefix):
        raise HTTPException(status_code=403, detail="Forbidden")
    try:
        data, content_type = await asyncio.to_thread(get_object, path)
    except Exception:
        raise HTTPException(status_code=404, detail="File not found")
    return Response(content=data, media_type=content_type)


@api_router.get("/")
async def root():
    return {"message": "Telluric Gaia Apparel Lab API online"}


# ----------------------------------------------------------------------------
# Seeding
# ----------------------------------------------------------------------------
async def seed_admin():
    admin_email = os.environ["ADMIN_EMAIL"].lower()
    admin_password = os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "user_id": f"user_{uuid.uuid4().hex[:12]}", "email": admin_email,
            "name": "Lab Admin", "password_hash": hash_password(admin_password),
            "role": "admin", "auth_provider": "password", "picture": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info("Seeded admin user")
    elif not existing.get("password_hash") or not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email},
                                  {"$set": {"password_hash": hash_password(admin_password), "role": "admin"}})


def _seed_products_data():
    return [
        {
            "name": "Stratos Shell Jacket", "price": 289.0, "material": "Recycled Bio-Polymer",
            "color_palette": "Cold Cyan", "eco_rating": 98.4, "carbon_label": "98.4% Carbon Negative",
            "stock": 18, "is_new": True, "featured": True, "activation_temp": "None",
            "description": "Our flagship weatherproof shell, woven from ocean-bound recycled bio-polymer with a bamboo-rayon lining. Fully sealed seams, packable, and built for the cold grid.",
            "images": ["https://images.unsplash.com/photo-1776589273706-527f8f195fda?crop=entropy&cs=srgb&fm=jpg&q=85",
                       "https://images.unsplash.com/photo-1535732176766-a9a9513547e5?crop=entropy&cs=srgb&fm=jpg&q=85",
                       "https://images.unsplash.com/photo-1519783841896-ca022fb97cc2?crop=entropy&cs=srgb&fm=jpg&q=85"],
            "composition": [{"material": "Recycled Bio-Polymer", "percent": 65}, {"material": "Bamboo Rayon", "percent": 35}],
            "tech_pack": {"chest": "112 cm", "sleeve": "66 cm", "length": "74 cm", "fiber_density": "320 GSM", "tensile_strength": "48 N/mm²", "weight_gsm": "320"},
        },
        {
            "name": "Telluric Hemp Hoodie", "price": 164.0, "material": "Hemp Canvas",
            "color_palette": "Void Black", "eco_rating": 97.1, "carbon_label": "97.1% Carbon Negative",
            "stock": 42, "is_new": True, "featured": True, "activation_temp": "None",
            "description": "Heavyweight raw hemp canvas hoodie, garment-dyed in void black. Naturally antimicrobial and UV-resistant, softening with every wear.",
            "images": ["https://images.unsplash.com/photo-1604689010734-72dc5075512e?crop=entropy&cs=srgb&fm=jpg&q=85",
                       "https://images.unsplash.com/photo-1775682112001-4069658c8f84?crop=entropy&cs=srgb&fm=jpg&q=85",
                       "https://images.unsplash.com/photo-1591625591034-75d303d2e1a4?crop=entropy&cs=srgb&fm=jpg&q=85"],
            "composition": [{"material": "Raw Hemp", "percent": 80}, {"material": "Organic Cotton", "percent": 20}],
            "tech_pack": {"chest": "118 cm", "sleeve": "64 cm", "length": "70 cm", "fiber_density": "420 GSM", "tensile_strength": "62 N/mm²", "weight_gsm": "420"},
        },
        {
            "name": "Bamboo Flux Tee", "price": 78.0, "material": "Bamboo Micro-Knit",
            "color_palette": "Cold Cyan", "eco_rating": 96.3, "carbon_label": "96.3% Carbon Negative",
            "stock": 60, "is_new": True, "featured": True, "activation_temp": "None",
            "description": "Silk-soft bamboo micro-knit tee with a tonal screen-printed chest sigil. Moisture-wicking, breathable, and fully compostable.",
            "images": ["https://images.unsplash.com/photo-1763750581767-b367bcd6c117?crop=entropy&cs=srgb&fm=jpg&q=85",
                       "https://images.unsplash.com/photo-1780566034595-8abc6d9207a4?crop=entropy&cs=srgb&fm=jpg&q=85",
                       "https://images.unsplash.com/photo-1715867125247-120c0fc4593b?crop=entropy&cs=srgb&fm=jpg&q=85"],
            "composition": [{"material": "Bamboo Rayon", "percent": 72}, {"material": "Organic Cotton", "percent": 28}],
            "tech_pack": {"chest": "104 cm", "sleeve": "22 cm", "length": "71 cm", "fiber_density": "180 GSM", "tensile_strength": "28 N/mm²", "weight_gsm": "180"},
        },
        {
            "name": "Bio-Fleece Tactical Vest", "price": 212.0, "material": "Organic Bio-Fleece",
            "color_palette": "Bio Olive", "eco_rating": 95.8, "carbon_label": "95.8% Carbon Negative",
            "stock": 24, "is_new": False, "featured": True, "activation_temp": "None",
            "description": "Insulated tactical vest spun from organic bio-fleece. Utility channels and a weatherproof hemp outer shell for cold-grid operations.",
            "images": ["https://images.unsplash.com/photo-1646633632840-1c95d61c909e?crop=entropy&cs=srgb&fm=jpg&q=85",
                       "https://images.unsplash.com/photo-1752674316405-549b77559eb3?crop=entropy&cs=srgb&fm=jpg&q=85",
                       "https://images.unsplash.com/photo-1534639077088-d702bcf685e7?crop=entropy&cs=srgb&fm=jpg&q=85"],
            "composition": [{"material": "Organic Bio-Fleece", "percent": 65}, {"material": "Hemp Canvas", "percent": 30}, {"material": "Recycled Fill", "percent": 5}],
            "tech_pack": {"chest": "116 cm", "sleeve": "0 cm", "length": "68 cm", "fiber_density": "380 GSM", "tensile_strength": "44 N/mm²", "weight_gsm": "380"},
        },
        {
            "name": "Gaia Cargo Pant", "price": 148.0, "material": "Hemp Canvas",
            "color_palette": "Bio Olive", "eco_rating": 96.9, "carbon_label": "96.9% Carbon Negative",
            "stock": 33, "is_new": True, "featured": False, "activation_temp": "None",
            "description": "Field-ready cargo pant in rugged hemp canvas with articulated knees and bamboo-lined pockets. Built for a lifetime, grown from a field.",
            "images": ["https://images.unsplash.com/photo-1661784396787-2a43e31a5689?crop=entropy&cs=srgb&fm=jpg&q=85",
                       "https://images.unsplash.com/photo-1691407981600-62ebb537a0f2?crop=entropy&cs=srgb&fm=jpg&q=85",
                       "https://images.unsplash.com/photo-1548883354-7622d03aca27?crop=entropy&cs=srgb&fm=jpg&q=85"],
            "composition": [{"material": "Raw Hemp", "percent": 75}, {"material": "Bamboo Rayon", "percent": 25}],
            "tech_pack": {"chest": "—", "sleeve": "—", "length": "104 cm", "fiber_density": "340 GSM", "tensile_strength": "58 N/mm²", "weight_gsm": "340"},
        },
        {
            "name": "Ember Longsleeve", "price": 112.0, "material": "Recycled Bio-Polymer",
            "color_palette": "Ember Amber", "eco_rating": 95.2, "carbon_label": "95.2% Carbon Negative",
            "stock": 29, "is_new": True, "featured": False, "activation_temp": "None",
            "description": "A full-sleeve bio-polymer canvas in warm ember amber. Lightweight, quick-drying, and cut for easy layering across the seasons.",
            "images": ["https://images.unsplash.com/photo-1780565336242-b7d1638c56cb?crop=entropy&cs=srgb&fm=jpg&q=85",
                       "https://images.unsplash.com/photo-1784850758006-21742e6553ad?crop=entropy&cs=srgb&fm=jpg&q=85",
                       "https://images.unsplash.com/photo-1761428961720-38db3883826b?crop=entropy&cs=srgb&fm=jpg&q=85"],
            "composition": [{"material": "Bamboo Rayon", "percent": 58}, {"material": "Recycled Bio-Polymer", "percent": 42}],
            "tech_pack": {"chest": "106 cm", "sleeve": "64 cm", "length": "72 cm", "fiber_density": "220 GSM", "tensile_strength": "34 N/mm²", "weight_gsm": "220"},
        },
        {
            "name": "Micro-Knit Base Layer", "price": 94.0, "material": "Bamboo Micro-Knit",
            "color_palette": "Void Black", "eco_rating": 97.6, "carbon_label": "97.6% Carbon Negative",
            "stock": 51, "is_new": False, "featured": False, "activation_temp": "None",
            "description": "Second-skin bamboo micro-knit base layer. Thermoregulating, odor-neutral, and seamless — the quiet foundation of every grid kit.",
            "images": ["https://images.unsplash.com/photo-1780566034595-8abc6d9207a4?crop=entropy&cs=srgb&fm=jpg&q=85",
                       "https://images.unsplash.com/photo-1763750581767-b367bcd6c117?crop=entropy&cs=srgb&fm=jpg&q=85"],
            "composition": [{"material": "Bamboo Rayon", "percent": 88}, {"material": "Elastane (bio)", "percent": 12}],
            "tech_pack": {"chest": "98 cm", "sleeve": "60 cm", "length": "69 cm", "fiber_density": "160 GSM", "tensile_strength": "30 N/mm²", "weight_gsm": "160"},
        },
        {
            "name": "Obsidian Field Parka", "price": 342.0, "material": "Hemp Canvas",
            "color_palette": "Void Black", "eco_rating": 96.0, "carbon_label": "96.0% Carbon Negative",
            "stock": 12, "is_new": True, "featured": True, "activation_temp": "None",
            "description": "A long-line hemp field parka with sealed seams, bamboo-fleece lining, and a weatherproof finish built for the deep cold.",
            "images": ["https://images.unsplash.com/photo-1535732176766-a9a9513547e5?crop=entropy&cs=srgb&fm=jpg&q=85",
                       "https://images.unsplash.com/photo-1776589273706-527f8f195fda?crop=entropy&cs=srgb&fm=jpg&q=85",
                       "https://images.unsplash.com/photo-1519783841896-ca022fb97cc2?crop=entropy&cs=srgb&fm=jpg&q=85"],
            "composition": [{"material": "Raw Hemp", "percent": 72}, {"material": "Bamboo Fleece", "percent": 28}],
            "tech_pack": {"chest": "124 cm", "sleeve": "68 cm", "length": "92 cm", "fiber_density": "450 GSM", "tensile_strength": "66 N/mm²", "weight_gsm": "450"},
        },
    ]


async def seed_products():
    # Migration: purge legacy thermochromic-ink catalog entries so cleaned versions reseed.
    await db.products.delete_many({"$or": [
        {"material": "Thermochromic Ink Shell"},
        {"description": {"$regex": "thermochromic", "$options": "i"}},
    ]})
    await db.products.update_many({"color_palette": "Thermal Amber"}, {"$set": {"color_palette": "Ember Amber"}})

    existing = set()
    async for d in db.products.find({}, {"name": 1}):
        existing.add(d["name"])
    inserted = 0
    for p in _seed_products_data():
        if p["name"] in existing:
            continue
        p["id"] = str(uuid.uuid4())
        p["category"] = "Apparel"
        p["sizes"] = ["XS", "S", "M", "L", "XL", "XXL"]
        p["created_at"] = datetime.now(timezone.utc).isoformat()
        await db.products.insert_one(p)
        inserted += 1
    if inserted:
        logger.info("Seeded %d products", inserted)


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id")
    await db.user_sessions.create_index("session_token")
    await db.products.create_index("id")
    await db.orders.create_index("id")
    await db.tryon_models.create_index("user_id")
    await db.tryon_jobs.create_index("user_id")
    await db.tryon_jobs.create_index("id")
    try:
        await asyncio.to_thread(init_storage)
        logger.info("Object storage initialized")
    except Exception as e:
        logger.error("Storage init failed: %s", e)
    await seed_admin()
    await seed_products()


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
