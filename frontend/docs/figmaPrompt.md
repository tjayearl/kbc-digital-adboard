Yes. If your goal is to give Figma AI (or Lovable, v0, Bolt, Galileo, etc.) a **single comprehensive prompt** that generates the entire Digital AdBoard V1 product exactly as described in the KBC brief, use this:

---

# KBC Digital AdBoard — Complete Product Design Prompt

Design a complete production-ready web application called **KBC Digital AdBoard**.

The application is an internal digital advertising booking and order management platform used by KBC sales teams, advertising managers, digital operations teams, and management.

The purpose of the platform is to eliminate vague advertising orders by generating a locked, itemized, priced Order Sheet that clearly defines deliverables, approvals, pricing, discounts, and campaign execution workflows.

---

## Technology Stack

Design for:

* React JS (Vite)
* TypeScript
* Tailwind CSS
* Shadcn/UI
* React Router
* Firebase Authentication
* Firestore
* Firebase Storage
* Firebase Cloud Functions
* Vercel Deployment

Use layouts and components that can be implemented directly with React and Tailwind.

---

# Design Principles

### Mobile First

Start at:

375px width

Then scale to:

* Tablet
* Desktop

### User Persona

Primary users are sales executives aged 50–55 with limited digital experience.

Requirements:

* Large buttons
* Large tap targets
* Plain language
* Guided workflows
* Minimal cognitive load
* Clear next actions
* No technical jargon
* Complete booking in under 10 minutes

### Visual Style

Professional enterprise platform.

Inspired by:

* Salesforce
* HubSpot
* Airtable
* Notion

Avoid:

* Gaming aesthetics
* Overly futuristic UI
* Complex dashboards
* Tiny text

---

# Brand System

Primary Navy

```css
#1A3E6F
```

Gold Accent

```css
#C8972B
```

Success Teal

```css
#0F6E56
```

Warning Red

```css
#B71C1C
```

Background

```css
#F7F7F7
```

Typography:

* Inter
* Semi Bold headings
* High readability

Components:

* 12px border radius
* Soft shadows
* Spacious layout
* Enterprise-grade design

---

# Global Navigation

Mobile:

Bottom Navigation

Items:

* Dashboard
* Campaigns
* Orders
* Approvals
* Profile

Desktop:

Collapsible Sidebar

Items:

* Dashboard
* Campaigns
* Order Sheets
* Approvals
* Digital Ops
* Reports
* Management
* Settings

---

# User Roles

Create dedicated experiences for:

### Sales

Can:

* Create campaigns
* Generate Order Sheets
* Request discounts
* Raise Change Orders
* View own campaigns

Cannot:

* Edit pricing
* Approve discounts
* Unlock campaigns

### Advertising Manager

Can:

* Approve discounts
* Reject discounts
* Countersign orders
* View all campaigns

### Digital Operations

Can:

* Receive approved briefs
* Validate materials
* Schedule campaigns
* Upload proof of delivery
* Generate reports

### Admin

Can:

* Manage users
* Manage rate card
* View everything

---

# Application Screens

## 1. Login

Features:

* KBC branding
* Email
* Password
* Forgot Password
* Remember Me

Visual:

* Navy background
* Gold accents
* Glass card

---

## 2. Dashboard

Role-based dashboard.

Cards:

* Active Campaigns
* Pending Approvals
* Revenue
* Awaiting Signatures

Quick Actions:

* New Campaign
* Generate Order Sheet
* Raise Change Order

---

# CAMPAIGN WORKFLOW

Create a wizard interface.

Progress Indicator:

1. Client
2. Campaign
3. Products
4. Pricing
5. Discount
6. Review
7. Order Sheet

Display progress visually.

---

## 3. Client Details

Fields:

* Company Name
* Client Name
* Phone
* Email
* Industry

---

## 4. Campaign Details

Fields:

* Campaign Name
* Objective
* Start Date
* End Date
* Notes

---

## 5. Product Configurator

Product Catalog Cards

Categories:

### Social Media

Fields:

* Platform
* Posts Per Day
* Duration

### Website Ads

Fields:

* Placement
* Duration

### Livestream Coverage

Fields:

* Hours
* Platforms

### Video Production

Fields:

* Quantity
* Format

### Digital Activation

Fields:

* Locations
* Duration

### Boosting

Fields:

* Budget
* Platforms

Every product should have:

* Quantity
* Unit
* Calculated Cost

No manual pricing allowed.

---

## 6. Live Pricing Engine

Sticky pricing summary.

Display:

* Subtotal
* VAT 16%
* Boosting Cost
* Discount
* Grand Total

Grand Total highlighted in Gold.

Prices appear locked.

---

## 7. Rate Card Management

Admin Only

Features:

* Product Name
* Category
* Unit Price
* Platform Pricing
* Version
* Updated Date

Actions:

* Add
* Edit
* Archive

Desktop Table

Mobile Cards

---

## 8. Discount Request

Display:

* Original Value
* Requested Discount
* Discount Amount
* Final Value

Field:

Reason for Request

Buttons:

* Submit
* Cancel

Statuses:

* Pending
* Approved
* Rejected

---

## 9. Approval Center

Advertising Manager Screen

Tabs:

### Pending Discounts

Approve
Reject

### Awaiting Countersign

Review Order
Countersign

### Payment Verification

Confirm Deposit
Confirm LPO

---

# ORDER SHEET SYSTEM

## 10. Order Sheet Preview

Professional document view.

Header:

KBC Letterhead

Display:

### DAB Reference

Format:

```text
DAB-YYYY-00001
```

Sections:

* Client Details
* Campaign Details
* Product Breakdown
* Boosting Breakdown
* Discount Breakdown
* Totals

Signature Areas:

* Client Signature
* Advertising Manager Signature

---

## 11. PDF Generation Success Screen

Show:

* PDF Generated
* DAB Reference
* Download PDF
* Print PDF
* Share PDF

---

## 12. Campaign Pipeline

Display campaigns.

Statuses:

* Draft
* Discount Pending
* Discount Approved
* Order Generated
* Client Signed
* Countersigned
* Payment Confirmed
* Brief Unlocked

Search

Filter

Sort

---

## 13. Campaign Details

Tabs:

Overview
Pricing
Order Sheet
Approvals
Audit Log

---

## 14. Audit Timeline

Show all actions.

Examples:

* Campaign Created
* Discount Requested
* Discount Approved
* PDF Generated
* Client Signed
* Payment Confirmed

Each event shows:

* User
* Role
* Timestamp

---

# PHASE 2

## 15. Digital Operations Dashboard

Cards:

* Ready for Execution
* Scheduled
* Live
* Delivered

---

## 16. Material Validation

Checklist:

* Artwork
* Video Assets
* Social Assets

Statuses:

* Pending
* Approved
* Rejected

---

## 17. Campaign Scheduling

Calendar Interface

Views:

* Day
* Week
* Month

---

## 18. Go-Live Tracking

Timeline View

Track:

* Scheduled
* Published
* Completed

Timestamp every action.

---

## 19. Proof of Delivery

Upload:

* Images
* PDFs
* Reports

Display gallery.

---

## 20. Report Generator

Auto-filled campaign data.

Sections:

* Planned Deliverables
* Delivered Deliverables
* Performance Summary

Export PDF.

---

# CHANGE ORDER SYSTEM

## 21. Raise Change Order

Display original campaign.

Add:

* Additional Products
* Additional Budget
* Additional Scope

Generate:

```text
DAB-CO-YYYY-00001
```

---

## 22. Change Order Approval

Same workflow:

Approval
Countersign
Payment

---

# MANAGEMENT MODULE

## 23. Executive Dashboard

Widgets:

* Total Revenue
* Active Campaigns
* Pending Approvals
* Discounts Given

---

## 24. Revenue Analytics

Charts:

* Monthly Revenue
* Revenue by Product
* Revenue by Sales Executive

---

## 25. Discount Analytics

Charts:

* Total Discounts
* Discount by Rep
* Discount by Month

---

## 26. Pipeline View

Kanban Style

Columns:

* Draft
* Pending Approval
* Approved
* In Execution
* Delivered

---

# COMPONENT LIBRARY

Create reusable:

* Buttons
* Inputs
* Dropdowns
* Date Pickers
* Search Bars
* Tables
* Cards
* Modals
* Drawers
* Tabs
* Role Badges
* Status Chips
* KPI Cards
* Timeline Components
* Upload Components

---

# UX REQUIREMENTS

Include:

* Empty States
* Loading States
* Error States
* Success States
* Confirmation Dialogs
* Toast Notifications
* Sticky Action Buttons
* Floating New Campaign Button

---

# DELIVERABLES

Generate:

* Complete design system
* Mobile screens
* Tablet screens
* Desktop screens
* Auto-layout components
* Developer-ready specifications
* Tailwind-friendly spacing system
* React component hierarchy
* User flow diagrams
* Design tokens
* Dark mode support

The final design should feel like a modern enterprise SaaS product built specifically for KBC Digital Division and ready for implementation using React, TypeScript, Tailwind, Firebase, and Vercel.

---

If this is for the actual KBC assignment, I would still build **only Phase 1 first** after the designs are generated. That's the milestone the brief considers the highest-value deliverable, and it's much more realistic to complete in a short assessment. 

Do not design this as a complex SaaS dashboard.

Prioritize forms, workflows, approvals, and document generation.

Analytics should be secondary.

Users should always know the next action to take.

Every screen should have a primary call-to-action.

The Order Sheet is the centerpiece of the application.

The visual design should constantly reinforce:

Campaign → Order Sheet → Approval

rather than

Campaign → Dashboard Analytics

Visual Style:

Inspired by:
- Banking systems
- Government portals
- ERP software
- Corporate procurement systems

Avoid:
- Glassmorphism
- Excessive gradients
- Neon colors
- Startup-style illustrations
- Overly playful UI

Design should communicate trust, compliance, approvals, and accountability.