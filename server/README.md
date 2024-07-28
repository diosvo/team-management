## How to start?

### Installation

To install virtualenv, run:

```bash
pip install virtualenv
```

### Usage

Set up and activate this project:

```bash
virtualenv .venv
source .venv/bin/activate
```

Install the requirement packages (If we need to upgrade packages, add `-U` param):

```bash
pip install -r requirements.txt
```

Use Alembic for auto migration:

```bash
alembic revision --autogenerate -m "Initial migration"
```

Start the project:

```bash
./start.sh
```

Now go to http://127.0.0.1:8000/docs to see the automatic interactive API documentation (Swagger UI)

## 🏗️ Architectures

### API Security 🔐

- [x] Authentication / Authorization (OAuth2)
- [x] Rate Limiting
- [x] Input Validation & Data Sanitization (Request Parameters, Headers, Payload)
- [x] Error Handling
- [x] Logging & Monitoring
- [x] IP Whitelisting
- [ ] Web Application Firewall
- [ ] API Versioning 2.0
- [ ] OWASP API Security Risks
