# Auth Testing Playbook — Telluric Gaia Apparel Lab

This app uses BOTH custom email/password JWT auth and Emergent-managed Google auth,
unified in the `users` collection (field `user_id` = UUID, `role` = customer|admin).

## Admin credentials (seeded on startup)
- Email: admin@telluricgaia.com
- Password: TelluricAdmin#2026

## API testing (use external REACT_APP_BACKEND_URL + /api)

### Email/password
```
# Register
curl -c c.txt -X POST "$API/api/auth/register" -H "Content-Type: application/json" \
  -d '{"name":"QA User","email":"qa.user@example.com","password":"qapass123"}'

# Login (admin)
curl -c c.txt -X POST "$API/api/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"admin@telluricgaia.com","password":"TelluricAdmin#2026"}'

# Me (cookie)
curl -b c.txt "$API/api/auth/me"
```

### Google auth (simulated for browser tests)
Create a session in Mongo and set the `session_token` cookie:
```
mongosh --eval "
use('test_database');
var uid='user_'+Date.now();
var tok='test_session_'+Date.now();
db.users.insertOne({user_id:uid,email:'g.'+Date.now()+'@example.com',name:'G Tester',role:'customer',auth_provider:'google',created_at:new Date().toISOString()});
db.user_sessions.insertOne({user_id:uid,session_token:tok,expires_at:new Date(Date.now()+7*864e5).toISOString(),created_at:new Date().toISOString()});
print('session_token: '+tok);
"
```
Then set cookie `session_token` (httpOnly, secure, sameSite None) and GET /api/auth/me.

## Product / order endpoints
- GET  /api/products  (filters: material, size, palette, search, is_new, featured, sort)
- GET  /api/products/{id}
- POST /api/products        (admin cookie required)
- PUT  /api/products/{id}   (admin)
- DELETE /api/products/{id} (admin)
- POST /api/orders          (guest or auth)
- GET  /api/orders          (auth; admin sees all)

## Checklist
- [ ] admin login returns user with role=admin and sets access_token cookie
- [ ] /api/auth/me returns the same user
- [ ] non-admin cannot POST /api/products (403)
- [ ] products list returns 8 seeded items; filters narrow results
- [ ] order creation returns tracking_hash
