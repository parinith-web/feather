# <p align="center"><img src="Frame 1 (2).png" alt="PurePixels - AI Background Removal" width="100%" /></p>

<p align="center">
  <a href="#features"><b>Features</b></a> |
  <a href="#screenshot-gallery"><b>Gallery</b></a> |
  <a href="#system-architecture"><b>Architecture</b></a> |
  <a href="#tech-stack"><b>Tech Stack</b></a> |
  <a href="#getting-started"><b>Local Setup</b></a> |
  <a href="#developer-api"><b>API Docs</b></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
  <br />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white" alt="Cloudinary" />
</p>

---

## 📸 Introduction

**PurePixels** is a state-of-the-art, production-ready **AI Background Removal Platform** built on a robust full-stack architecture. By combining a beautiful, interactive, and fluid frontend with a high-performance, secure backend, PurePixels makes background removal seamless for both everyday users and professional developers.

Integrated with top-tier cloud services, payment gateways, and advanced machine learning models (powered by Clipdrop's background segmentation engine), it functions both as a SaaS application with tiered subscription models and as a developer-first programmatic background removal utility.

---

## ✨ Features

- ⚡ **AI-Powered Background Removal**: Superb contour and foreground edge segmentation using state-of-the-art image segmentation models.
- 🎨 **Visual Image Comparison**: A beautiful, custom-designed interactive before/after split slider to review segmentation details.
- 🔐 **Premium Authentication & OTP Verification**: Bulletproof JWT authentication accompanied by high-security transactional OTP verification emails powered by **Resend**.
- 💳 **Razorpay Payment Integration**: Fully functional billing system for purchasing background processing credits with support for secure checkout packages (Monthly & Yearly).
- 🛠️ **Developer Portal & REST API**: Allows developers to generate, rotate, and manage secure API keys (`pp_sk_...`) and call the programmatic `/v1/remove-background` endpoint to stream processed image buffers back.
- 📁 **Cloudinary Hosted Assets**: Highly optimized, distributed cloud storage for user-history images, allowing permanent retrieval and automatic cleanup.
- 📊 **User History & Usage Logs**: Track daily usage, credit consumption, historical processed images, download files, and manage account properties.
- 🎨 **Rich Aesthetics & UI**: Completely designed with cohesive dark modes, beautiful glassmorphism gradients, polished micro-animations, and dynamic visual transitions.

---

## 🖼️ Screenshot Gallery

Here is a visual tour of the PurePixels application interface, showcasing its sleek dark aesthetics and user flows:

### 1. The Landing Page & Core Interface
Discover a premium, interactive homepage with step-by-step guides, features grid, pricing previews, and a dynamic interactive section.

<p align="center">
  <img src="Screenshot 2026-05-31 013044.png" alt="PurePixels Homepage Hero" width="49%" />
  <img src="Screenshot 2026-05-31 013059.png" alt="PurePixels Features & How It Works" width="49%" />
</p>

---

### 2. High-Performance Dashboard & Interactive Comparison Slider
Upload any PNG/JPEG image (up to 10MB) and watch as the background removal engine isolates the subject. Slide between the original and the processed image to check edge precision.

<p align="center">
  <img src="Screenshot 2026-05-31 013517.png" alt="PurePixels AI Image Processor" width="49%" />
  <img src="Screenshot 2026-05-31 013620.png" alt="Interactive Before/After Slider" width="49%" />
</p>

---

### 3. Developer Documentation & API Key Management
PurePixels empowers developers by offering custom integration scripts, structured REST requests, and instant API Key rotation.

<p align="center">
  <img src="Screenshot 2026-05-31 013657.png" alt="Interactive API Documentation" width="49%" />
  <img src="Screenshot 2026-05-31 014028.png" alt="Developer Keys & Settings" width="49%" />
</p>

---

## ⚙️ System Architecture

PurePixels is architected around a decoupled **Stateless Client-API pattern** configured to process intensive machine learning operations asynchronously while managing transactional state safely.

### 🏛️ Layered Component Blueprint
The block diagram below maps the boundary interactions of client interfaces, REST controllers, Mongoose schemas, and third-party integrations:

```mermaid
graph TB
    %% Subgraphs representing different architectural bounds
    subgraph ClientSub ["Client Layer (React Single Page App)"]
        SPA["React 18 Single Page App<br/>(Vite / TypeScript)"]
        Routing["React Router DOM v6<br/>(Protected Dash & Auth Routes)"]
        State["TanStack Query (React Query)<br/>(Server State caching)"]
        CompareUI["Interactive UI Slider<br/>(Contrast Comparison)"]
    end

    subgraph APIGateway ["API Gateway Layer (Express.js Server)"]
        Server["Node.js HTTP Server<br/>(Express Core)"]
        CORS["CORS Policy Middleware<br/>(Origin Verification)"]
        Multer["Multer File Uploader<br/>(In-Memory Buffer Parsing)"]
        AuthMiddleware["JWT Validation Middleware<br/>(requireAuth)"]
        ApiKeyMiddleware["API Key Validation Middleware<br/>(requireApiKey)"]
    end

    subgraph ServiceIntegrations ["Third-Party Service Engine"]
        Clipdrop["Clipdrop API<br/>(Background Segmentation AI)"]
        Cloudinary["Cloudinary CDN<br/>(Image Asset Hosting)"]
        Resend["Resend SMTP API<br/>(Transactional OTP Emails)"]
        Razorpay["Razorpay Gateway<br/>(Payment Processing SDK)"]
    end

    subgraph PersistenceLayer ["Persistence Storage Layer (NoSQL)"]
        Mongoose["Mongoose ODM<br/>(Schema Mapping)"]
        MongoDB[("MongoDB Database<br/>(User, Image, Usage, Transaction)")]
    end

    %% Client Layer internal relationships
    SPA --> Routing
    SPA --> State
    SPA --> CompareUI

    %% Client-to-Server interactions
    CompareUI --> |"HTTP Multipart Form-Data"| Multer
    SPA --> |"HTTP Header Bearer JWT"| AuthMiddleware
    SPA --> |"HTTP Header Bearer API Key"| ApiKeyMiddleware

    %% Server Core routing
    Multer --> Server
    AuthMiddleware --> Server
    ApiKeyMiddleware --> Server
    CORS --> Server

    %% Server-to-External Services connections
    Server --> |"Post Raw Buffer (Clipdrop Key)"| Clipdrop
    Server --> |"Upload base64 Image"| Cloudinary
    Server --> |"Send OTP JSON payload"| Resend
    Server --> |"Initiate Order / Capture Payment"| Razorpay

    %% Server-to-Database persistence
    Server --> Mongoose
    Mongoose --> MongoDB

    %% CSS Styles for High-Quality Visual Mapping
    classDef clientClass fill:#0f172a,stroke:#3b82f6,stroke-width:2px,color:#f8fafc;
    classDef gatewayClass fill:#022c22,stroke:#059669,stroke-width:2px,color:#ecfdf5;
    classDef serviceClass fill:#311042,stroke:#a21caf,stroke-width:2px,color:#fae8ff;
    classDef dbClass fill:#1c1917,stroke:#78716c,stroke-width:2px,color:#f5f5f4;

    class SPA,Routing,State,CompareUI clientClass;
    class Server,CORS,Multer,AuthMiddleware,ApiKeyMiddleware gatewayClass;
    class Clipdrop,Cloudinary,Resend,Razorpay serviceClass;
    class Mongoose,MongoDB dbClass;
```

---

### 🔄 Background Removal Transaction Lifecycle
Here is the sequence of events showing how a background removal request is parsed, authenticated, verified against credit quotas, sent to the ML segmentation engine, and persisted:

```mermaid
sequenceDiagram
    autonumber
    actor Developer as Developer / User Client
    participant API as API Gateway (routes.js)
    participant Auth as Auth Middleware
    participant Cloudinary as Cloudinary CDN
    participant Clipdrop as Clipdrop AI Service
    participant DB as MongoDB (Mongoose)

    Developer->>API: POST /api/images/process (with Image file + Auth header)
    activate API
    API->>Auth: Verify JWT / API Key (`requireAuth` or `requireApiKey`)
    activate Auth
    alt Token Invalid
        Auth-->>Developer: Return 401 Unauthorized
    else Token Valid
        Auth-->>API: Return User Session Metadata (Plan, Credits)
    end
    deactivate Auth

    API->>DB: Check credit quota
    activate DB
    DB-->>API: User plan = "Free" (processedToday < 5) OR Pro (credits > 0)
    deactivate DB

    alt Quota Exhausted
        API-->>Developer: Return 400 Bad Request (Limit Reached)
    end

    %% Cloudinary Original Upload
    API->>Cloudinary: Upload original image (Base64 original buffer)
    activate Cloudinary
    Cloudinary-->>API: Return secure_url (Original Image URL)
    deactivate Cloudinary

    %% Background Removal Request
    API->>Clipdrop: Forward original buffer to remove-background API (multipart)
    activate Clipdrop
    Clipdrop-->>API: Return isolated PNG buffer (binary stream)
    deactivate Clipdrop

    %% Cloudinary Processed Upload
    API->>Cloudinary: Upload processed buffer (Base64 processed)
    activate Cloudinary
    Cloudinary-->>API: Return secure_url (Processed Image URL)
    deactivate Cloudinary

    %% Database updates
    API->>DB: Deduct 1 credit OR increment processedToday counter
    activate DB
    DB-->>API: Confirmation (Save metadata to Image history)
    deactivate DB

    API-->>Developer: Return processed URL & remaining credits (JSON / File stream)
    deactivate API
```

---

## 🛠️ Tech Stack

### Frontend Client
- **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling & UI**: [Tailwind CSS](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/) (Radix Primitives)
- **Animation**: [Framer Motion](https://www.framer.com/motion/) for premium transition effects
- **State & Data Fetching**: [TanStack Query v5 (React Query)](https://tanstack.com/query/latest) + [React Router DOM v6](https://reactrouter.com/)
- **Charts & Indicators**: [Recharts](https://recharts.org/) for modern usage analytics graphs
- **Validation**: [Zod](https://zod.dev/) + [React Hook Form](https://react-hook-form.com/)

### Backend Server
- **Runtime & Framework**: [Node.js](https://nodejs.org/) (ES Modules) + [Express](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose ODM](https://mongoosejs.com/)
- **Cloud Media Hosting**: [Cloudinary](https://cloudinary.com/) (Dynamic file upload/management)
- **Transaction Processing**: [Razorpay API](https://razorpay.com/) (Secure orders, billing pipelines)
- **Email Delivery Service**: [Resend API](https://resend.com/) (Transactional sign-up validation OTPs)
- **Authentication**: JWT (JSON Web Tokens) with cryptographically secure signatures + [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **Segmentation Provider**: [Clipdrop API](https://clipdrop.co/) (Standard background removal models)

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have the following installed on your local environment:
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [MongoDB](https://www.mongodb.com/try/download/community) running locally or a MongoDB Atlas URI

---

### 2. Environment Variables Configuration

#### Backend Setup (`/server/.env`)
Create a `.env` file in the `server` directory and fill in the required keys:
```env
PORT=5001
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173,http://localhost:8080

# Database & Token Security
MONGODB_URI=mongodb://127.0.0.1:27017/purepixels
JWT_SECRET=your_long_cryptographically_secure_random_string

# Core Segmentation API (Clipdrop API Key)
# Note: If left empty in development, the system runs in a local mock processing mode
CLIPDROP_API_KEY=your_clipdrop_api_key_here

# Cloudinary Integration (For remote permanent history storage)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Razorpay Integration (For credit billing/subscriptions)
# Note: Set ALLOW_MOCK_PAYMENTS=true to bypass Razorpay transactions in dev mode
ALLOW_MOCK_PAYMENTS=true
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Resend Mailer Integration (For signup OTP verification)
# Note: If left empty in development, OTPs will print to your terminal logs for testing!
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=PurePixels <onboarding@yourdomain.com>
```

#### Frontend Setup (`/client/.env`)
Create a `.env` file in the `client` directory:
```env
VITE_API_BASE_URL=http://localhost:5001/api
```

---

### 3. Installation & Run Commands

You can run the frontend and backend concurrently or in separate terminals.

#### To run the Backend Server:
```bash
cd server
npm install
npm run dev
```

#### To run the Frontend Client:
```bash
cd client
npm install
npm run dev
```
Open your browser and navigate to `http://localhost:8180` or the Vite dev URL provided in the terminal to view the application.

---

## 🛠️ Developer API

PurePixels offers a high-performance programmatic API designed for developer integrations. Generate an API Key under the **Profile/API** section in your dashboard to start issuing requests.

### Authentication
All requests must pass your API Key in the standard HTTP header:
```http
Authorization: Bearer pp_sk_your_secret_key_here
```

### Background Removal Endpoint
Remove backgrounds programmatically by sending any image file via standard multipart-form headers. The response returns the processed binary data directly as an image buffer stream.

`POST /api/v1/remove-background`

#### Parameter Schema
| Name | Type | Position | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `image` | binary | Form Data | Yes | The file upload containing your JPEG or PNG image (max 10MB). |

#### Request Examples

##### Curl Request
```bash
curl -X POST http://localhost:5001/api/v1/remove-background \
  -H "Authorization: Bearer pp_sk_YOUR_API_KEY" \
  -F "image=@/path/to/my_photo.jpg" \
  --output clean_image.png
```

##### Node.js / Axios Request
```javascript
import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

const removeBackground = async () => {
  const form = new FormData();
  form.append('image', fs.createReadStream('./photo.jpg'));

  try {
    const response = await axios.post('http://localhost:5001/api/v1/remove-background', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': 'Bearer pp_sk_YOUR_API_KEY',
      },
      responseType: 'arraybuffer', // Streaming raw binary PNG
    });

    fs.writeFileSync('./no-bg.png', response.data);
    console.log('Background successfully isolated!');
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
  }
};

removeBackground();
```

---

## 📁 Repository Structure

```text
purepixels/
├── client/                 # React SPA built with Vite & TypeScript
│   ├── src/
│   │   ├── components/     # UI elements & layout blocks (Shadcn + Landing components)
│   │   ├── pages/          # Index, Dashboard, ApiDocs, Pricing, Profile, Auth Pages
│   │   └── index.css       # Core styling & Tailwind imports
│   ├── package.json
│   └── vite.config.ts
├── server/                 # Node.js + Express + Mongoose Backend
│   ├── server.js           # Server runner & database initialization
│   ├── routes.js           # REST API endpoints & payment validation routines
│   ├── models.js           # Database Mongoose Schemas (User, Image, Transaction, Usage)
│   └── package.json
├── Frame 1 (2).png         # Banner / Cover Preview
└── README.md               # Documentation & Setup Reference (this file)
```

---

## 📜 License
This project is licensed under the [MIT License](LICENSE). Feel free to customize and extend it as you see fit!
