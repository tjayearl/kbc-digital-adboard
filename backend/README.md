# KBC Digital AdBoard (DAB)

Internal digital advertising booking and order management system for KBC Digital Division.

## What This Is
Digital AdBoard replaces KBC's vague paper-based digital campaign booking process with a structured, locked, and auditable workflow. Sales executives configure a campaign, the system prices it from a locked rate card, and generates a signed Order Sheet before the Digital team touches anything.

**The one rule that matters:** The sales executive never hand-types a price and never edits a generated Order Sheet. All pricing is set by the system from the rate card.

## Tech Stack
| Layer | Tool |
| :--- | :--- |
| **Frontend** | React + Vite + TypeScript + Tailwind CSS |
| **Database** | Firebase Firestore |
| **Auth** | Firebase Auth (with custom claims) |
| **File Storage** | Cloudinary |
| **PDF Generation** | FastAPI + ReportLab |
| **Frontend Hosting** | Vercel |
| **Backend Hosting** | Render |

## Project Structure
```text
kbc-digital-adboard/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py          # Environment settings
│   │   │   ├── firebase.py        # Firebase Admin SDK init
│   │   │   └── security.py        # JWT verification, role guards
│   │   ├── models/
│   │   │   ├── campaign.py        # Campaign schemas + status enum
│   │   │   ├── change_order.py    # Change Order schemas
│   │   │   ├── order_sheet.py     # Order Sheet schemas
│   │   │   ├── rate_card.py       # Rate card schemas
│   │   │   └── user.py            # User schemas + role enum
│   │   ├── routers/
│   │   │   ├── auth.py            # Set custom claims
│   │   │   ├── campaigns.py       # Campaign CRUD
│   │   │   ├── change_orders.py   # Change Order workflow
│   │   │   ├── discounts.py       # Discount request + approval
│   │   │   ├── execution.py       # Go-live logging + POD upload
│   │   │   ├── order_sheet.py     # Generate, sign, countersign, pay
│   │   │   ├── rate_card.py       # Rate card management
│   │   │   ├── reports.py         # Pipeline + report generation
│   │   │   └── users.py           # User management
│   │   └── services/
│   │       ├── audit.py           # Immutable audit log writer
│   │       ├── cloudinary_service.py # File upload to Cloudinary
│   │       ├── dab_ref.py         # DAB reference number generator
│   │       └── pdf_service.py     # Order Sheet PDF generation
│   ├── .env                       # Environment variables (never commit)
│   ├── .gitignore
│   ├── requirements.txt
│   ├── run.py                     # Dev server entry point
│   └── serviceAccountKey.json     # Firebase service account (never commit)
└── README.md
```

## Roles & Permissions
| Role | Key Permissions |
| :--- | :--- |
| **Sales** | Configure campaigns, generate order sheets, request discounts, raise change orders. Cannot edit prices. |
| **Ad Manager** | Approve/reject discounts, countersign order sheets, view all pipeline. |
| **Digital Ops** | View unlocked briefs only, log go-live, upload proof of delivery, generate reports. |
| **Finance** | Confirm or dispute payment. Unlocks brief for Digital Ops. |
| **Admin** | Full access. Edit rate card. Manage users. |

*Roles are enforced at the Firestore security rule level — not just hidden in the UI.*

## Campaign Status Flow
`draft` → `discountPending` (if discount requested) → `discountApproved` (Ad Manager approves) → `orderSheetGenerated` (Sales generates PDF) → `clientSigned` (client signs + Air-Time serial entered) → `adManagerCountersigned` → `paymentConfirmed` (Finance confirms — brief unlocks here) → `briefUnlocked` → `inExecution` → `delivered` → `reported` → `closed`

**Hard gate:** Brief stays locked until all three are true:
1. Signed Order Sheet uploaded.
2. Air-Time Order serial entered.
3. Payment confirmed by Finance.
*No override.*

## API Endpoints
**Base URL (local):** `http://localhost:8000`  
**Base URL (production):** `https://your-render-app.onrender.com`

| Method | Endpoint | Role | Description |
| :--- | :--- | :--- | :--- |
| POST | `/api/v1/auth/set-role` | Admin | Assign role to user |
| GET | `/api/v1/users/` | Admin | List all users |
| POST | `/api/v1/users/` | Admin | Create user |
| PATCH | `/api/v1/users/{uid}` | Admin | Update user |
| GET | `/api/v1/rate-card/` | All | Get rate card |
| POST | `/api/v1/rate-card/` | Admin | Add rate card item |
| PATCH | `/api/v1/rate-card/{id}` | Admin | Update rate card item |
| DELETE | `/api/v1/rate-card/{id}` | Admin | Delete rate card item |
| POST | `/api/v1/campaigns/` | Sales | Create campaign |
| GET | `/api/v1/campaigns/` | All | List campaigns (role-filtered) |
| GET | `/api/v1/campaigns/{id}` | All | Get campaign |
| DELETE | `/api/v1/campaigns/{id}` | Admin | Delete campaign |
| POST | `/api/v1/discounts/{id}/request` | Sales | Request discount |
| POST | `/api/v1/discounts/{id}/review` | Ad Manager | Approve/reject discount |
| POST | `/api/v1/order-sheet/{id}/generate` | Sales | Generate locked PDF |
| POST | `/api/v1/order-sheet/{id}/upload-signed` | Sales | Upload signed sheet |
| POST | `/api/v1/order-sheet/{id}/countersign` | Ad Manager | Countersign order sheet |
| POST | `/api/v1/order-sheet/{id}/confirm-payment`| Finance | Confirm payment |
| POST | `/api/v1/change-orders/` | Sales | Raise change order |
| GET | `/api/v1/change-orders/campaign/{id}` | All | Get change orders |
| POST | `/api/v1/execution/{id}/go-live` | Digital Ops | Log go-live |
| POST | `/api/v1/execution/{id}/pod` | Digital Ops | Upload proof of delivery |
| POST | `/api/v1/reports/{id}/generate` | Digital Ops | Generate campaign report |
| GET | `/api/v1/reports/pipeline` | Admin/Ad Manager | Live pipeline + revenue |

## Local Development Setup
### Prerequisites
- Python 3.14+
- Firebase project with Firestore and Auth enabled
- Cloudinary account (free tier)
- Firebase service account key

### Backend Setup
```bash
# Clone the repo
git clone https://github.com/your-username/kbc-digital-adboard.git
cd kbc-digital-adboard/backend

# Create and activate virtual environment
python -m venv .venv --without-pip
.venv\Scripts\Activate.ps1 # Windows
# source .venv/bin/activate # Mac/Linux

# Install pip into venv then install dependencies
.venv\Scripts\python.exe get-pip.py
.venv\Scripts\pip.exe install -r requirements.txt

# Add environment variables
cp .env.example .env
```
1. Fill in your values in `.env`.
2. Download your Firebase service account key from the Firebase Console and save it as `serviceAccountKey.json` in the `backend/` folder.
3. Run the development server:
```bash
.venv\Scripts\python.exe run.py
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
