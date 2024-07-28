## How to start?

### Installation 

To install virtualenv run:

```bash
pip install virtualenv
```

### Usage

Set up and activate this project:

```bash
virtualenv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Start the project:

```bash
./start.sh
```

Now go to http://127.0.0.1:8000/docs to see the automatic interactive API documentation (Swagger UI)

## 🏗️ Architectures

### API Security 🔐

- [ ] Authentication (Token - JWT)
- [ ] Authorization
- [x] Rate Limiting
- [ ] Input Validation & Data Sanitization
- [ ] Encryption
- [x] Error Handling
- [x] Logging & Monitoring
- [ ] Security Headers
- [ ] Token Expiry
- [x] IP Whitelisting
- [ ] Web Application Firewall
- [ ] API Versioning 2.0

# 🕶️ References

## Official Pages

- [Alembic](https://alembic.sqlalchemy.org/en/latest/)
- [FastAPI](https://fastapi.tiangolo.com/)

## Repositories

- [Full Stack FastAPI Template](https://github.com/tiangolo/full-stack-fastapi-template/tree/master)
- [FastAPI Best Practices](https://github.com/zhanymkanov/fastapi-best-practices)
- [FastAPI Backend Template](https://github.com/Aeternalis-Ingenium/FastAPI-Backend-Template)
- [FastAPI MongoDB](https://github.com/grillazz/fastapi-mongodb)

## Helpers

- [Semantic Versioning 2.0.0](https://semver.org/) + [](https://medium.com/@amirm.lavasani/how-to-add-automatic-versioning-to-your-fastapi-service-b008ed5f3edc)
- [Use TOML for `.env` files?](https://snarky.ca/use-toml-for-env-files/)
