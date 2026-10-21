"""Backend API tests for Telluric Gaia Apparel Lab."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://thermo-hemp-lab.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@telluricgaia.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")


@pytest.fixture(scope="session")
def anon():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["user"]["role"] == "admin"
    return s


@pytest.fixture(scope="session")
def customer_session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    email = f"TEST_qa_{uuid.uuid4().hex[:8]}@example.com"
    r = s.post(f"{API}/auth/register", json={"name": "QA Tester", "email": email, "password": "qapass123"})
    assert r.status_code == 200, r.text
    return s, email


# ---------------- Health ----------------
def test_root(anon):
    r = anon.get(f"{API}/")
    assert r.status_code == 200
    assert "online" in r.json().get("message", "").lower()


# ---------------- Auth ----------------
class TestAuth:
    def test_admin_login(self, admin_session):
        r = admin_session.get(f"{API}/auth/me")
        assert r.status_code == 200
        assert r.json()["user"]["role"] == "admin"

    def test_invalid_login(self, anon):
        r = anon.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_register_duplicate(self, customer_session, anon):
        _, email = customer_session
        r = anon.post(f"{API}/auth/register", json={"name": "Dup", "email": email, "password": "qapass123"})
        assert r.status_code == 400

    def test_me_unauthenticated(self, anon):
        s = requests.Session()
        r = s.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_customer_login_cycle(self, customer_session):
        s, email = customer_session
        s.post(f"{API}/auth/logout")
        r = s.post(f"{API}/auth/login", json={"email": email, "password": "qapass123"})
        assert r.status_code == 200
        assert r.json()["user"]["role"] == "customer"


# ---------------- Products ----------------
class TestProducts:
    def test_list_products_seeded(self, anon):
        r = anon.get(f"{API}/products")
        assert r.status_code == 200
        prods = r.json()
        assert len(prods) >= 8
        assert all("_id" not in p for p in prods)

    def test_filter_material_hemp(self, anon):
        r = anon.get(f"{API}/products", params={"material": "Hemp Canvas"})
        assert r.status_code == 200
        prods = r.json()
        assert len(prods) == 3
        assert all(p["material"] == "Hemp Canvas" for p in prods)

    def test_filter_palette(self, anon):
        r = anon.get(f"{API}/products", params={"palette": "Cold Cyan"})
        assert r.status_code == 200
        assert all(p["color_palette"] == "Cold Cyan" for p in r.json())

    def test_filter_size(self, anon):
        r = anon.get(f"{API}/products", params={"size": "M"})
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_sort_price_asc(self, anon):
        r = anon.get(f"{API}/products", params={"sort": "price_asc"})
        prices = [p["price"] for p in r.json()]
        assert prices == sorted(prices)

    def test_filters_meta(self, anon):
        r = anon.get(f"{API}/products/meta/filters")
        assert r.status_code == 200
        data = r.json()
        assert "materials" in data and "sizes" in data and "palettes" in data

    def test_get_single_product(self, anon):
        prods = anon.get(f"{API}/products").json()
        pid = prods[0]["id"]
        r = anon.get(f"{API}/products/{pid}")
        assert r.status_code == 200
        assert r.json()["id"] == pid

    def test_product_404(self, anon):
        r = anon.get(f"{API}/products/does-not-exist")
        assert r.status_code == 404


# ---------------- Admin control ----------------
class TestAdminProducts:
    def test_non_admin_cannot_create(self, customer_session):
        s, _ = customer_session
        r = s.post(f"{API}/products", json={
            "name": "Hack", "description": "x", "price": 1.0,
            "material": "Hemp Canvas", "color_palette": "Void Black"
        })
        assert r.status_code == 403

    def test_anonymous_cannot_create(self, anon):
        s = requests.Session()
        r = s.post(f"{API}/products", json={
            "name": "Hack", "description": "x", "price": 1.0,
            "material": "Hemp Canvas", "color_palette": "Void Black"
        })
        assert r.status_code == 401

    def test_admin_crud_product(self, admin_session):
        payload = {
            "name": "TEST_Product", "description": "test desc", "price": 50.0,
            "material": "Hemp Canvas", "color_palette": "Void Black",
            "sizes": ["M", "L"], "images": [], "composition": [], "tech_pack": {},
        }
        r = admin_session.post(f"{API}/products", json=payload)
        assert r.status_code == 200, r.text
        prod = r.json()
        pid = prod["id"]
        assert prod["name"] == "TEST_Product"
        assert "_id" not in prod

        # GET verify
        got = admin_session.get(f"{API}/products/{pid}").json()
        assert got["price"] == 50.0

        # Update
        payload["price"] = 99.0
        r = admin_session.put(f"{API}/products/{pid}", json=payload)
        assert r.status_code == 200
        assert r.json()["price"] == 99.0

        # Delete
        r = admin_session.delete(f"{API}/products/{pid}")
        assert r.status_code == 200
        r = admin_session.get(f"{API}/products/{pid}")
        assert r.status_code == 404


# ---------------- Orders ----------------
class TestOrders:
    def _order_payload(self, prod):
        return {
            "items": [{"product_id": prod["id"], "name": prod["name"], "image": None,
                       "size": "M", "color": prod["color_palette"],
                       "price": prod["price"], "quantity": 1}],
            "shipping": {"full_name": "QA", "email": "qa@example.com", "address": "1 St",
                         "city": "City", "postal_code": "00000", "country": "US"},
            "shipping_tier": "Standard Eco", "shipping_cost": 0.0,
            "subtotal": prod["price"], "total": prod["price"],
        }

    def test_guest_order_creates_tracking(self, anon):
        prods = anon.get(f"{API}/products").json()
        r = anon.post(f"{API}/orders", json=self._order_payload(prods[0]))
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["tracking_hash"].startswith("TG-")
        assert body["status"] == "confirmed"
        assert "_id" not in body

    def test_customer_orders_listed(self, customer_session, anon):
        s, _ = customer_session
        prods = anon.get(f"{API}/products").json()
        s.post(f"{API}/orders", json=self._order_payload(prods[0]))
        r = s.get(f"{API}/orders")
        assert r.status_code == 200
        orders = r.json()
        assert len(orders) >= 1
        assert all(o.get("user_id") for o in orders)

    def test_orders_requires_auth(self):
        s = requests.Session()
        r = s.get(f"{API}/orders")
        assert r.status_code == 401


# ---------------- NEW: Search & Inventory Sync ----------------
class TestSearchAndInventory:
    def test_search_parka(self, anon):
        r = anon.get(f"{API}/products", params={"search": "parka"})
        assert r.status_code == 200
        prods = r.json()
        assert len(prods) >= 1
        assert any("parka" in p["name"].lower() for p in prods)

    def test_search_no_match(self, anon):
        r = anon.get(f"{API}/products", params={"search": "zzzzznothing"})
        assert r.status_code == 200
        assert r.json() == []

    def test_search_case_insensitive(self, anon):
        r = anon.get(f"{API}/products", params={"search": "PARKA"})
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_inventory_decrement_on_order(self, anon):
        prods = anon.get(f"{API}/products").json()
        prod = next(p for p in prods if p["stock"] >= 5)
        pid = prod["id"]
        before = anon.get(f"{API}/products/{pid}").json()["stock"]
        qty = 2
        payload = {
            "items": [{"product_id": pid, "name": prod["name"], "image": None,
                       "size": "M", "color": prod["color_palette"],
                       "price": prod["price"], "quantity": qty}],
            "shipping": {"full_name": "QA", "email": "qa@example.com", "address": "1 St",
                         "city": "City", "postal_code": "00000", "country": "US"},
            "shipping_tier": "Standard Eco", "shipping_cost": 0.0,
            "subtotal": prod["price"] * qty, "total": prod["price"] * qty,
        }
        r = anon.post(f"{API}/orders", json=payload)
        assert r.status_code == 200, r.text
        after = anon.get(f"{API}/products/{pid}").json()["stock"]
        assert after == before - qty, f"Expected {before - qty}, got {after}"

    def test_insufficient_stock_rejected(self, anon):
        prods = anon.get(f"{API}/products").json()
        prod = prods[0]
        pid = prod["id"]
        current = anon.get(f"{API}/products/{pid}").json()["stock"]
        qty = current + 1000
        payload = {
            "items": [{"product_id": pid, "name": prod["name"], "image": None,
                       "size": "M", "color": prod["color_palette"],
                       "price": prod["price"], "quantity": qty}],
            "shipping": {"full_name": "QA", "email": "qa@example.com", "address": "1 St",
                         "city": "City", "postal_code": "00000", "country": "US"},
            "shipping_tier": "Standard Eco", "shipping_cost": 0.0,
            "subtotal": prod["price"] * qty, "total": prod["price"] * qty,
        }
        r = anon.post(f"{API}/orders", json=payload)
        assert r.status_code == 400
        assert "insufficient stock" in r.json().get("detail", "").lower()
        # stock unchanged
        after = anon.get(f"{API}/products/{pid}").json()["stock"]
        assert after == current


# ---------------- NEW: Try-On (Virtual Fitting Room) ----------------
import base64, time

# 1x1 PNG
_TINY_PNG_B64 = (
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP8z8DwHwAFBQIAX8jx0g"
    "AAAABJRU5ErkJggg=="
)


@pytest.fixture(scope="session")
def tryon_user_a():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    email = f"TEST_tryon_a_{uuid.uuid4().hex[:6]}@example.com"
    r = s.post(f"{API}/auth/register", json={"name": "QA A", "email": email, "password": "qapass123"})
    assert r.status_code == 200, r.text
    token = r.json().get("token")
    return s, email, token


@pytest.fixture(scope="session")
def tryon_user_b():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    email = f"TEST_tryon_b_{uuid.uuid4().hex[:6]}@example.com"
    r = s.post(f"{API}/auth/register", json={"name": "QA B", "email": email, "password": "qapass123"})
    assert r.status_code == 200, r.text
    token = r.json().get("token")
    return s, email, token


class TestTryOn:
    def test_models_requires_auth(self, anon):
        s = requests.Session()
        r = s.get(f"{API}/tryon/models")
        assert r.status_code == 401

    def test_create_model_and_list(self, tryon_user_a):
        s, _, _ = tryon_user_a
        payload = {"frames": [_TINY_PNG_B64, _TINY_PNG_B64], "label": "QA Model"}
        r = s.post(f"{API}/tryon/models", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["frame_count"] == 2
        assert len(data["frames"]) == 2
        assert all(f["url"].startswith("/api/tryon/file/") for f in data["frames"])
        # list
        r2 = s.get(f"{API}/tryon/models")
        assert r2.status_code == 200
        assert any(m["id"] == data["id"] for m in r2.json())

    def test_file_requires_auth_and_token_query_works(self, tryon_user_a, anon):
        s, _, token = tryon_user_a
        models = s.get(f"{API}/tryon/models").json()
        assert models
        url = models[0]["frames"][0]["url"]  # /api/tryon/file/<path>
        full = f"{BASE_URL}{url}"
        # no auth -> 401
        anon_s = requests.Session()
        r = anon_s.get(full)
        assert r.status_code == 401
        # with ?token= -> 200
        r2 = anon_s.get(f"{full}?token={token}")
        assert r2.status_code == 200
        assert r2.headers.get("content-type", "").startswith("image/")

    def test_other_user_cannot_access_file(self, tryon_user_a, tryon_user_b):
        sa, _, _ = tryon_user_a
        _, _, token_b = tryon_user_b
        models = sa.get(f"{API}/tryon/models").json()
        url = models[0]["frames"][0]["url"]
        r = requests.get(f"{BASE_URL}{url}?token={token_b}")
        assert r.status_code == 403

    def test_generate_requires_model_and_product(self, tryon_user_a):
        s, _, _ = tryon_user_a
        r = s.post(f"{API}/tryon/generate", json={"model_id": "nope", "product_id": "nope"})
        assert r.status_code == 404

    def test_generate_and_poll_completes(self, tryon_user_a, anon):
        s, _, token = tryon_user_a
        models = s.get(f"{API}/tryon/models").json()
        model_id = models[0]["id"]
        prods = anon.get(f"{API}/products").json()
        pid = prods[0]["id"]
        r = s.post(f"{API}/tryon/generate", json={"model_id": model_id, "product_id": pid})
        assert r.status_code == 200, r.text
        job_id = r.json()["job_id"]
        assert r.json()["status"] == "processing"

        # poll
        final = None
        deadline = time.time() + 180
        while time.time() < deadline:
            jr = s.get(f"{API}/tryon/jobs/{job_id}")
            assert jr.status_code == 200
            body = jr.json()
            if body["status"] in ("complete", "failed"):
                final = body
                break
            time.sleep(3)
        assert final is not None, "job did not finish within timeout"
        assert final["status"] == "complete", f"job final: {final}"
        assert len(final["frames"]) >= 1
        # gallery lists it
        g = s.get(f"{API}/tryon/gallery").json()
        assert any(j["id"] == job_id for j in g)
        # fetch result image via token
        url = final["frames"][0]["url"]
        img = requests.get(f"{BASE_URL}{url}?token={token}")
        assert img.status_code == 200
        assert img.headers.get("content-type", "").startswith("image/")

    def test_delete_gallery(self, tryon_user_a):
        s, _, _ = tryon_user_a
        g = s.get(f"{API}/tryon/gallery").json()
        if not g:
            pytest.skip("no gallery items")
        jid = g[0]["id"]
        r = s.delete(f"{API}/tryon/gallery/{jid}")
        assert r.status_code == 200
        g2 = s.get(f"{API}/tryon/gallery").json()
        assert all(j["id"] != jid for j in g2)
