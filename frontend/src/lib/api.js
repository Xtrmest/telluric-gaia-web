import { INITIAL_PRODUCTS, INITIAL_USERS, PRODUCT_FILTERS } from "../data/mockData";

export const API = "/api";

const TOKEN_KEY = "tg_token";
const PRODUCTS_KEY = "tg_products_v2";
const USERS_KEY = "tg_users_v1";
const CURRENT_USER_KEY = "tg_current_user_v1";
const ORDERS_KEY = "tg_orders_v1";
const PAYPAL_PENDING_KEY = "tg_paypal_pending_v1";
const TRYON_MODELS_KEY = "tg_tryon_models_v1";
const TRYON_JOBS_KEY = "tg_tryon_jobs_v1";

// In-memory fallback store in case localStorage quota is exceeded (e.g. large base64 camera frames)
const memoryStore = new Map();

function readStore(key, fallback) {
  try {
    if (memoryStore.has(key)) {
      return structuredClone(memoryStore.get(key));
    }
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore storage read errors
  }
  const initial = typeof fallback === "function" ? fallback() : structuredClone(fallback);
  writeStore(key, initial);
  return structuredClone(initial);
}

function writeStore(key, value) {
  memoryStore.set(key, structuredClone(value));
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // If localStorage quota is exceeded (e.g., high-res base64 images), keep in memoryStore
  }
}

function makeError(status, detail) {
  const err = new Error(typeof detail === "string" ? detail : "Request failed");
  err.response = { status, data: { detail } };
  return err;
}

function randomId(prefix = "") {
  const hex = Array.from({ length: 12 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
  return prefix ? `${prefix}_${hex}` : hex;
}

function publicUser(doc) {
  if (!doc) return null;
  return {
    user_id: doc.user_id,
    email: doc.email,
    name: doc.name || "",
    picture: doc.picture || null,
    role: doc.role || "customer",
    auth_provider: doc.auth_provider || "password",
  };
}

function getProducts() {
  return readStore(PRODUCTS_KEY, () => INITIAL_PRODUCTS);
}

function saveProducts(products) {
  writeStore(PRODUCTS_KEY, products);
}

function getUsers() {
  return readStore(USERS_KEY, () => INITIAL_USERS);
}

function saveUsers(users) {
  writeStore(USERS_KEY, users);
}

function getCurrentUser() {
  const token = localStorage.getItem(TOKEN_KEY);
  const storedUser = readStore(CURRENT_USER_KEY, null);
  if (storedUser) return storedUser;
  if (token) {
    const users = getUsers();
    const matched = users.find((u) => token.includes(u.user_id));
    if (matched) return matched;
  }
  return null;
}

function setCurrentUser(user) {
  if (user) {
    writeStore(CURRENT_USER_KEY, user);
  } else {
    memoryStore.delete(CURRENT_USER_KEY);
    try {
      localStorage.removeItem(CURRENT_USER_KEY);
    } catch {
      // Ignore
    }
  }
}

function requireAuth() {
  const user = getCurrentUser();
  if (!user) throw makeError(401, "Not authenticated");
  return user;
}

function requireAdmin() {
  const user = requireAuth();
  if (user.role !== "admin") throw makeError(403, "Admin access required");
  return user;
}

export const setAuthToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Ignore storage errors
  }
};

export function mediaUrl(path) {
  if (!path) return "";
  return path;
}

export function formatApiErrorDetail(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail
      .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
      .filter(Boolean)
      .join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith("data:")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function renderTryOnFrame(personUrl, product, index, total) {
  if (typeof document === "undefined") {
    return product.images?.[index % (product.images?.length || 1)] || personUrl;
  }
  try {
    const canvas = document.createElement("canvas");
    const width = 600;
    const height = 800;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#07080C";
    ctx.fillRect(0, 0, width, height);

    try {
      const personImg = await loadImage(personUrl);
      ctx.drawImage(personImg, 0, 0, width, height);
    } catch {
      // Fallback background if person frame cannot be drawn
    }

    const garmentSrc = product.images?.[index % (product.images?.length || 1)] || product.images?.[0];
    if (garmentSrc) {
      try {
        const garmentImg = await loadImage(garmentSrc);
        ctx.save();
        ctx.globalAlpha = 0.86;
        const gw = width * 0.62;
        const gh = height * 0.52;
        const gx = (width - gw) / 2;
        const gy = height * 0.22;
        ctx.drawImage(garmentImg, gx, gy, gw, gh);
        ctx.restore();
      } catch {
        // Ignore CORS image draw errors
      }
    }

    // Lab HUD overlay
    const grad = ctx.createLinearGradient(0, height - 150, 0, height);
    grad.addColorStop(0, "rgba(7, 8, 12, 0)");
    grad.addColorStop(1, "rgba(7, 8, 12, 0.9)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, height - 150, width, 150);

    ctx.strokeStyle = "rgba(0, 242, 254, 0.5)";
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 16, width - 32, height - 32);

    ctx.fillStyle = "#00F2FE";
    ctx.font = "bold 13px monospace";
    ctx.fillText(`// TELLURIC GAIA TRY-ON · FRAME ${index + 1}/${total}`, 32, height - 56);

    ctx.fillStyle = "#F1F5F9";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText(product.name.toUpperCase(), 32, height - 30);

    return canvas.toDataURL("image/jpeg", 0.85);
  } catch {
    return personUrl || product.images?.[0] || "";
  }
}

function normalizePath(url = "") {
  const clean = url.replace(/^https?:\/\/[^/]+/, "").replace(/^\/api/, "");
  const [pathname, queryString] = clean.split("?");
  const queryParams = {};
  if (queryString) {
    const sp = new URLSearchParams(queryString);
    for (const [k, v] of sp.entries()) {
      queryParams[k] = v;
    }
  }
  return { pathname: pathname.startsWith("/") ? pathname : `/${pathname}`, queryParams };
}

function filterAndSortProducts(products, params = {}) {
  let list = [...products];
  const { gender, category, subcategory, season, material, palette, size, is_new, featured, search, sort = "newest" } = params;

  if (gender && gender !== "all") {
    list = list.filter((p) => p.gender === gender || p.gender === "Unisex");
  }
  if (category && category !== "all") {
    list = list.filter((p) => p.category === category);
  }
  if (subcategory && subcategory !== "all") {
    list = list.filter((p) => p.subcategory === subcategory);
  }
  if (season && season !== "all") {
    list = list.filter((p) => p.season === season);
  }
  if (material && material !== "all") {
    list = list.filter((p) => p.material === material);
  }
  if (palette && palette !== "all") {
    list = list.filter((p) => p.color_palette === palette);
  }
  if (size && size !== "all") {
    list = list.filter((p) => Array.isArray(p.sizes) && p.sizes.includes(size));
  }
  if (is_new !== undefined && is_new !== null && is_new !== "") {
    const flag = is_new === true || is_new === "true";
    list = list.filter((p) => Boolean(p.is_new) === flag);
  }
  if (featured !== undefined && featured !== null && featured !== "") {
    const flag = featured === true || featured === "true";
    list = list.filter((p) => Boolean(p.featured) === flag);
  }
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.material?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.subcategory?.toLowerCase().includes(q) ||
        p.season?.toLowerCase().includes(q)
    );
  }

  if (sort === "price_asc") {
    list.sort((a, b) => a.price - b.price);
  } else if (sort === "price_desc") {
    list.sort((a, b) => b.price - a.price);
  } else if (sort === "eco") {
    list.sort((a, b) => (b.eco_rating || 0) - (a.eco_rating || 0));
  } else {
    list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }

  return list;
}

function deductInventoryForOrder(items) {
  const products = getProducts();
  const shortages = [];

  for (const item of items || []) {
    const product = products.find((p) => p.id === item.product_id);
    if (!product) continue;
    if ((product.stock ?? 0) < item.quantity) {
      shortages.push(`${item.name} (${product.stock ?? 0} left)`);
    }
  }
  if (shortages.length > 0) {
    throw makeError(400, "Insufficient stock for: " + shortages.join(", "));
  }

  for (const item of items || []) {
    const product = products.find((p) => p.id === item.product_id);
    if (product) {
      product.stock = Math.max(0, (product.stock ?? 0) - item.quantity);
    }
  }
  saveProducts(products);
}

async function handleRequest(method, rawUrl, body = {}, config = {}) {
  const { pathname, queryParams } = normalizePath(rawUrl);
  const params = { ...queryParams, ...(config?.params || {}) };

  // Root check
  if (method === "GET" && pathname === "/") {
    return { data: { message: "Telluric Gaia Apparel Lab static client online" }, status: 200 };
  }

  // Auth routes
  if (method === "POST" && pathname === "/auth/register") {
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    const name = String(body?.name || "").trim();
    if (!email || ! email.includes("@")) throw makeError(400, "Valid email is required");
    if (password.length < 6) throw makeError(400, "Password must be at least 6 characters");
    if (!name) throw makeError(400, "Name is required");

    const users = getUsers();
    if (users.some((u) => u.email.toLowerCase() === email)) {
      throw makeError(400, "Email already registered");
    }
    const user_id = randomId("user");
    const doc = {
      user_id,
      email,
      name,
      password,
      role: "customer",
      auth_provider: "password",
      picture: null,
      created_at: new Date().toISOString(),
    };
    users.push(doc);
    saveUsers(users);
    const token = `static_token_${user_id}`;
    setAuthToken(token);
    setCurrentUser(doc);
    return { data: { user: publicUser(doc), token }, status: 200 };
  }

  if (method === "POST" && pathname === "/auth/login") {
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    const users = getUsers();
    const user = users.find((u) => u.email.toLowerCase() === email && u.password === password);
    if (!user) {
      throw makeError(401, "Invalid email or password");
    }
    const token = `static_token_${user.user_id}`;
    setAuthToken(token);
    setCurrentUser(user);
    return { data: { user: publicUser(user), token }, status: 200 };
  }

  if (method === "POST" && pathname === "/auth/google-session") {
    const users = getUsers();
    const email = "google.operator@telluricgaia.com";
    let user = users.find((u) => u.email.toLowerCase() === email);
    if (!user) {
      user = {
        user_id: randomId("user"),
        email,
        name: "Gaia Google Operator",
        password: null,
        role: "customer",
        auth_provider: "google",
        picture: null,
        created_at: new Date().toISOString(),
      };
      users.push(user);
      saveUsers(users);
    }
    const token = `static_token_${user.user_id}`;
    setAuthToken(token);
    setCurrentUser(user);
    return { data: { user: publicUser(user), token }, status: 200 };
  }

  if (method === "GET" && pathname === "/auth/me") {
    const user = requireAuth();
    return { data: { user: publicUser(user) }, status: 200 };
  }

  if (method === "POST" && pathname === "/auth/logout") {
    setAuthToken(null);
    setCurrentUser(null);
    return { data: { success: true }, status: 200 };
  }

  // Products routes
  if (method === "GET" && pathname === "/products/meta/filters") {
    return { data: structuredClone(PRODUCT_FILTERS), status: 200 };
  }

  if (method === "GET" && pathname === "/products") {
    const products = getProducts();
    return { data: filterAndSortProducts(products, params), status: 200 };
  }

  const productMatch = pathname.match(/^\/products\/([^/]+)$/);
  if (productMatch) {
    const productId = decodeURIComponent(productMatch[1]);
    const products = getProducts();
    const index = products.findIndex((p) => p.id === productId);

    if (method === "GET") {
      if (index === -1) throw makeError(404, "Product not found");
      return { data: products[index], status: 200 };
    }

    if (method === "PUT") {
      requireAdmin();
      if (index === -1) throw makeError(404, "Product not found");
      const updated = {
        ...products[index],
        ...body,
        id: productId,
      };
      products[index] = updated;
      saveProducts(products);
      return { data: updated, status: 200 };
    }

    if (method === "DELETE") {
      requireAdmin();
      if (index === -1) throw makeError(404, "Product not found");
      products.splice(index, 1);
      saveProducts(products);
      return { data: { success: true }, status: 200 };
    }
  }

  if (method === "POST" && pathname === "/products") {
    requireAdmin();
    const products = getProducts();
    const doc = {
      category: "Apparel",
      sizes: ["XS", "S", "M", "L", "XL", "XXL"],
      images: [],
      eco_rating: 95.0,
      carbon_label: "Carbon Negative",
      stock: 25,
      composition: [],
      tech_pack: {},
      activation_temp: "None",
      is_new: true,
      featured: false,
      ...body,
      id: randomId("prod"),
      created_at: new Date().toISOString(),
    };
    products.unshift(doc);
    saveProducts(products);
    return { data: doc, status: 200 };
  }

  // Orders routes
  if (method === "POST" && pathname === "/orders") {
    const user = getCurrentUser();
    deductInventoryForOrder(body?.items || []);
    const orders = readStore(ORDERS_KEY, []);
    const doc = {
      ...body,
      id: randomId("order"),
      tracking_hash: "TG-" + randomId().slice(0, 12).toUpperCase(),
      status: "confirmed",
      user_id: user ? user.user_id : null,
      created_at: new Date().toISOString(),
    };
    orders.unshift(doc);
    writeStore(ORDERS_KEY, orders);
    return { data: doc, status: 200 };
  }

  if (method === "GET" && pathname === "/orders") {
    const user = requireAuth();
    const orders = readStore(ORDERS_KEY, []);
    const filtered =
      user.role === "admin" ? orders : orders.filter((o) => o.user_id === user.user_id);
    filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return { data: filtered, status: 200 };
  }

  const orderMatch = pathname.match(/^\/orders\/([^/]+)$/);
  if (method === "GET" && orderMatch) {
    const orderId = decodeURIComponent(orderMatch[1]);
    const orders = readStore(ORDERS_KEY, []);
    const order = orders.find((o) => o.id === orderId);
    if (!order) throw makeError(404, "Order not found");
    return { data: order, status: 200 };
  }

  // PayPal routes
  if (method === "GET" && pathname === "/paypal/config") {
    const clientId = process.env.REACT_APP_PAYPAL_CLIENT_ID || "";
    return {
      data: {
        configured: Boolean(clientId),
        client_id: clientId,
        mode: process.env.REACT_APP_PAYPAL_MODE || "sandbox",
        currency: "USD",
      },
      status: 200,
    };
  }

  if (method === "POST" && pathname === "/paypal/create-order") {
    const items = body?.items || [];
    if (!items.length) throw makeError(400, "Cart is empty");
    const user = getCurrentUser();
    const subtotal = Number(items.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2));
    const shippingCost = Number(body?.shipping_cost || 0);
    const total = Number((subtotal + shippingCost).toFixed(2));
    const paypalOrderId = randomId("pp");
    const pendingList = readStore(PAYPAL_PENDING_KEY, []);
    pendingList.push({
      paypal_order_id: paypalOrderId,
      user_id: user ? user.user_id : null,
      items,
      shipping: body?.shipping,
      shipping_tier: body?.shipping_tier || "Standard Eco",
      shipping_cost: shippingCost,
      subtotal,
      total,
      created_at: new Date().toISOString(),
    });
    writeStore(PAYPAL_PENDING_KEY, pendingList);
    return { data: { id: paypalOrderId }, status: 200 };
  }

  const paypalCaptureMatch = pathname.match(/^\/paypal\/capture\/([^/]+)$/);
  if (method === "POST" && paypalCaptureMatch) {
    const paypalOrderId = decodeURIComponent(paypalCaptureMatch[1]);
    const pendingList = readStore(PAYPAL_PENDING_KEY, []);
    const pendingIndex = pendingList.findIndex((p) => p.paypal_order_id === paypalOrderId);
    if (pendingIndex === -1) throw makeError(404, "Pending order not found");
    const pending = pendingList[pendingIndex];

    deductInventoryForOrder(pending.items);
    const user = getCurrentUser();
    const order = {
      id: randomId("order"),
      tracking_hash: "TG-" + randomId().slice(0, 12).toUpperCase(),
      status: "confirmed",
      user_id: pending.user_id || (user ? user.user_id : null),
      items: pending.items,
      shipping: pending.shipping,
      shipping_tier: pending.shipping_tier,
      shipping_cost: pending.shipping_cost,
      subtotal: pending.subtotal,
      total: pending.total,
      payment_method: "paypal",
      payment_status: "paid",
      paypal_order_id: paypalOrderId,
      created_at: new Date().toISOString(),
    };
    const orders = readStore(ORDERS_KEY, []);
    orders.unshift(order);
    writeStore(ORDERS_KEY, orders);
    pendingList.splice(pendingIndex, 1);
    writeStore(PAYPAL_PENDING_KEY, pendingList);
    return { data: order, status: 200 };
  }

  // Virtual Fitting Room (Try-On) routes
  if (method === "GET" && pathname === "/tryon/models") {
    const user = requireAuth();
    const models = readStore(TRYON_MODELS_KEY, []);
    const userModels = models
      .filter((m) => m.user_id === user.user_id)
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return { data: userModels, status: 200 };
  }

  if (method === "POST" && pathname === "/tryon/models") {
    const user = requireAuth();
    const frames = (body?.frames || []).slice(0, 12);
    if (!frames.length) throw makeError(400, "At least one frame is required");
    const model = {
      id: randomId("model"),
      user_id: user.user_id,
      label: body?.label || "My Model",
      frame_count: frames.length,
      frames: frames.map((url, index) => ({ index, url })),
      created_at: new Date().toISOString(),
    };
    const models = readStore(TRYON_MODELS_KEY, []);
    models.unshift(model);
    writeStore(TRYON_MODELS_KEY, models);
    return { data: model, status: 200 };
  }

  if (method === "POST" && pathname === "/tryon/generate") {
    const user = requireAuth();
    const models = readStore(TRYON_MODELS_KEY, []);
    const model = models.find((m) => m.id === body?.model_id && m.user_id === user.user_id);
    if (!model) throw makeError(404, "Model not found");
    const products = getProducts();
    const product = products.find((p) => p.id === body?.product_id);
    if (!product) throw makeError(404, "Product not found");

    const sourceFrames = model.frames.slice(0, 12);
    const renderedFrames = [];
    for (let i = 0; i < sourceFrames.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      const url = await renderTryOnFrame(sourceFrames[i].url, product, i, sourceFrames.length);
      renderedFrames.push({ index: i, url });
    }

    const jobId = randomId("job");
    const job = {
      id: jobId,
      user_id: user.user_id,
      model_id: model.id,
      product_id: product.id,
      product_name: product.name,
      product_image: product.images?.[0] || null,
      status: "complete",
      total: sourceFrames.length,
      done: sourceFrames.length,
      failed: 0,
      frames: renderedFrames,
      created_at: new Date().toISOString(),
    };
    const jobs = readStore(TRYON_JOBS_KEY, []);
    jobs.unshift(job);
    writeStore(TRYON_JOBS_KEY, jobs);
    return {
      data: { job_id: jobId, status: "processing", total: sourceFrames.length },
      status: 200,
    };
  }

  const jobMatch = pathname.match(/^\/tryon\/jobs\/([^/]+)$/);
  if (method === "GET" && jobMatch) {
    const user = requireAuth();
    const jobId = decodeURIComponent(jobMatch[1]);
    const jobs = readStore(TRYON_JOBS_KEY, []);
    const job = jobs.find((j) => j.id === jobId && j.user_id === user.user_id);
    if (!job) throw makeError(404, "Job not found");
    return { data: job, status: 200 };
  }

  if (method === "GET" && pathname === "/tryon/gallery") {
    const user = requireAuth();
    const jobs = readStore(TRYON_JOBS_KEY, []);
    const userJobs = jobs
      .filter((j) => j.user_id === user.user_id && j.status === "complete")
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return { data: userJobs, status: 200 };
  }

  const galleryDeleteMatch = pathname.match(/^\/tryon\/gallery\/([^/]+)$/);
  if (method === "DELETE" && galleryDeleteMatch) {
    const user = requireAuth();
    const jobId = decodeURIComponent(galleryDeleteMatch[1]);
    const jobs = readStore(TRYON_JOBS_KEY, []);
    const idx = jobs.findIndex((j) => j.id === jobId && j.user_id === user.user_id);
    if (idx === -1) throw makeError(404, "Job not found");
    jobs.splice(idx, 1);
    writeStore(TRYON_JOBS_KEY, jobs);
    return { data: { success: true }, status: 200 };
  }

  throw makeError(404, `Endpoint not found: ${method} ${pathname}`);
}

export const api = {
  get: (url, config) => handleRequest("GET", url, undefined, config),
  post: (url, data, config) => handleRequest("POST", url, data, config),
  put: (url, data, config) => handleRequest("PUT", url, data, config),
  delete: (url, config) => handleRequest("DELETE", url, undefined, config),
};
