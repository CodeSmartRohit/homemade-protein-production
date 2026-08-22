import os
import sys

def install_and_import():
    try:
        import reportlab
    except ImportError:
        print("Installing reportlab...")
        os.system(f"{sys.executable} -m pip install reportlab")
        import reportlab

install_and_import()

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 9)
        self.setFillColor(colors.HexColor("#71717a"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "HOMEMADE Protein — Full-Stack Master Project Guide")
            self.setStrokeColor(colors.HexColor("#e4e4e7"))
            self.setLineWidth(0.5)
            self.line(54, 742, 558, 742)
            
        # Footer
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 36, page_text)
        self.drawString(54, 36, "CONFIDENTIAL & EDUCATIONAL RESOURCE — BUILT WITH NEXT.JS & NODE.JS")
        self.setStrokeColor(colors.HexColor("#e4e4e7"))
        self.setLineWidth(0.5)
        self.line(54, 48, 558, 48)
        self.restoreState()

def build_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Palette
    c_primary = colors.HexColor("#d97706")    # Amber 600
    c_dark = colors.HexColor("#1c1917")       # Stone 900
    c_body = colors.HexColor("#334155")       # Slate 700
    c_bg_light = colors.HexColor("#fef3c7")   # Amber 100
    c_accent = colors.HexColor("#0284c7")     # Sky 600
    
    # Custom Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=c_dark,
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=c_primary,
        spaceAfter=15
    )
    
    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=c_dark,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=c_primary,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=c_body,
        spaceAfter=6
    )
    
    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=body_style,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=4
    )
    
    code_style = ParagraphStyle(
        'Code_Custom',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=4
    )

    story = []
    
    # --- Title Banner ---
    story.append(Paragraph("HOMEMADE PROTEIN — PROJECT MASTER GUIDE", title_style))
    story.append(Paragraph("Full-Stack E-Commerce & Meal Subscription Architecture | Built from Scratch", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=c_primary, spaceBefore=0, spaceAfter=12))
    
    # --- Section 1: Executive Summary & Overview ---
    story.append(Paragraph("1. Executive Summary & Tech Stack Overview", h1_style))
    story.append(Paragraph(
        "<b>HOMEMADE Protein</b> is a production-ready, full-stack web application designed for custom high-protein meal ordering, dietary request management, and real-time order tracking. Built with modern web standards, it features dynamic 3D cards, multi-role authentication, instant WhatsApp/Email admin alerts, and automated database resiliency.",
        body_style
    ))
    
    tech_data = [
        [Paragraph("<b>Layer</b>", body_style), Paragraph("<b>Technologies Used</b>", body_style), Paragraph("<b>Key Responsibilities</b>", body_style)],
        [Paragraph("Frontend", body_style), Paragraph("Next.js 16 (React 18), Tailwind CSS, Framer Motion", body_style), Paragraph("Responsive UI, 3D Product Cards, Cart State, Live Stepper", body_style)],
        [Paragraph("Backend", body_style), Paragraph("Node.js, Express.js, Socket.IO, Nodemailer", body_style), Paragraph("REST API endpoints, Real-time WebSockets, Admin Notifications", body_style)],
        [Paragraph("Database", body_style), Paragraph("MongoDB / Mongoose + Local JSON DB Fallback", body_style), Paragraph("User data, Orders, Categories, Custom Meal Requests", body_style)],
        [Paragraph("Security & Auth", body_style), Paragraph("JWT, bcryptjs, Helmet, Express Rate Limit", body_style), Paragraph("Role-based auth (User/Chef/Admin), Password Hashing", body_style)],
        [Paragraph("Integrations", body_style), Paragraph("Razorpay SDK, CallMeBot WhatsApp API, Gmail SMTP", body_style), Paragraph("Online Payments, Instant WhatsApp & Email Admin Alerts", body_style)]
    ]
    t_tech = Table(tech_data, colWidths=[90, 200, 214])
    t_tech.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_bg_light),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t_tech)
    story.append(Spacer(1, 10))

    # --- Section 2: Building From Scratch Journey ---
    story.append(Paragraph("2. Step-by-Step Development Journey (From Scratch)", h1_style))
    
    steps = [
        ("Step 1: System Design & API Contract", "Defined the REST API routes (`/api/auth`, `/api/menu`, `/api/orders`, `/api/requests`) and structured Mongoose schemas for User, MenuItem, Order, Category, and CustomRequest."),
        ("Step 2: Backend Core & Middleware", "Configured Express server with security headers (`helmet`), CORS cross-origin policies, cookie parsing, and structured centralized error handling middleware."),
        ("Step 3: Dual Database Strategy", "Engineered `connectDB` with automatic fallback to `localDb.js` (JSON-backed engine) to ensure zero downtime even if cloud database connection fails."),
        ("Step 4: Next.js Frontend Setup", "Built responsive client app using Next.js App Router. Integrated Tailwind CSS for amber/dark protein theme and Context API (`AuthContext`, `CartContext`)."),
        ("Step 5: Interactive 3D UI & Shopping Cart", "Crafted `ProductCard3D` using Framer Motion for interactive tilt & pop animations. Built off-canvas sliding cart with persistent local storage."),
        ("Step 6: Role-Based Dashboards", "Engineered 3 distinct interfaces: Customer Ordering Portal, Chef Live Kitchen Dashboard, and Admin Control Panel with menu item/category CRUD."),
        ("Step 7: Real-Time Order Tracking & Payments", "Integrated WebSockets (Socket.IO) for live status transitions (Pending → Preparing → Out for Delivery). Integrated Razorpay payment gateway."),
        ("Step 8: Automated Admin Notification System", "Implemented `notificationService` using Nodemailer (Gmail SMTP) and CallMeBot/Twilio WhatsApp API to send instant order alerts to admin phone (`9340623657`)."),
        ("Step 9: Production Crash-Hardening & Deployment", "Hardened JS type checks (safe `.toFixed(2)` number coercions, safe Next.js `use(params)` unwrapping), configured Node 18+ engine, and deployed to Vercel & Render.")
    ]
    
    for title, desc in steps:
        story.append(Paragraph(f"<b>• {title}:</b> {desc}", bullet_style))
    story.append(Spacer(1, 8))

    # --- Section 3: Core Features Implemented ---
    story.append(Paragraph("3. Complete Feature Matrix", h1_style))
    
    features = [
        ["Feature Module", "Description & Implementation Highlight"],
        ["User & RBAC Auth", "JWT authentication with HTTP-only cookies. Roles: Customer, Chef, Admin."],
        ["3D Food Menu", "Interactive meal showcase with dynamic category filtering and macro nutrition breakdown."],
        ["Custom Meal Requests", "Form for users to request tailored protein meals (servings, target calories, budget)."],
        ["Real-Time Track Stepper", "Step-by-step order visualizer powered by WebSockets for instant status pushes."],
        ["Instant Admin Alerts", "Triggers WhatsApp & Gmail notifications to admin immediately upon order placement."],
        ["Multi-Payment Gateway", "Supports Cash on Delivery (COD) & Razorpay Online Payments with signature verification."],
        ["Recycle Bin Auto-Cleanup", "Background cron job purging soft-deleted admin accounts older than 10 days."]
    ]
    t_feat = Table(features, colWidths=[140, 364])
    t_feat.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t_feat)
    story.append(Spacer(1, 10))

    # --- Section 4: Learning Roadmap & Prerequisites ---
    story.append(Paragraph("4. Complete Learning Roadmap to Build This Yourself", h1_style))
    story.append(Paragraph("To replicate this project independently, master the following core topics in sequence:", body_style))
    
    roadmap = [
        ("1. Modern JavaScript (ES6+)", "Arrow functions, Async/Await, Promises, Destructuring, Spread operator, Array methods (`map`, `filter`, `reduce`), Modules (`import`/`export` and `require`)."),
        ("2. React & Next.js App Router", "JSX, Props vs State, `useState`, `useEffect`, `useContext`, `useCallback`, Server vs Client Components (`'use client'`), Dynamic Routing (`/orders/[id]`), Layouts."),
        ("3. Styling & Animations", "Tailwind CSS utility classes, Flexbox/Grid layouts, Responsive breakpoints (`md:`, `lg:`), Framer Motion (`motion.div`, `useMotionValue`, `useTransform`)."),
        ("4. Node.js & Express.js Backend", "RESTful API principles, Express Routing, Middleware chain (`req, res, next`), Error handling, CORS, Rate limiting, Environment variables with `dotenv`."),
        ("5. Databases & ORM/ODM", "MongoDB Atlas setup, Document databases vs Relational, Mongoose Schemas, Models, Queries (`find`, `populate`), Database indexing, File-system JSON storage."),
        ("6. Real-Time & Integrations", "WebSockets concept, Socket.IO client & server rooms, Nodemailer SMTP configuration, Third-party Webhook & REST API integrations."),
        ("7. Production Engineering", "Defensive JavaScript (null checks, number type coercion before `.toFixed()`), Git version control, Vercel/Render cloud deployment workflows.")
    ]
    
    for topic, detail in roadmap:
        story.append(Paragraph(f"<b>{topic}:</b> {detail}", bullet_style))
    story.append(Spacer(1, 8))

    # --- Section 5: Core Engineering Concepts & Best Practices ---
    story.append(Paragraph("5. Critical Engineering Concepts & Patterns Used", h1_style))
    
    concepts = [
        ["Concept", "Why It Matters & Code Pattern"],
        ["Defensive Number Formatting", "Prevents fatal React render crashes: use `Number(val || 0).toFixed(2)` instead of `val?.toFixed(2)` on string prices."],
        ["Hybrid DB Resiliency", "Server starts immediately and falls back to local JSON if MongoDB cloud DNS/host fails (`connectDB()` fallback to `localDb.js`)."],
        ["Non-Blocking Notifications", "Notification dispatches (`notifyNewOrder`) execute asynchronously (`Promise.allSettled`) so order placement speed is never delayed."],
        ["State Management (Context API)", "Centralized `CartContext` & `AuthContext` allow header, cart sidebar, and checkout to share live state effortlessly."]
    ]
    t_conc = Table(concepts, colWidths=[150, 354])
    t_conc.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_bg_light),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t_conc)
    story.append(Spacer(1, 14))

    # --- Summary Box ---
    summary_box = [
        [Paragraph("<b>🎓 Summary & Master Certificate Note</b><br/>This document outlines the full blueprint of the HOMEMADE Protein platform. By following the 5-part learning roadmap above, you will possess all technical skills required to build scalable, full-stack commercial web applications from scratch.", body_style)]
    ]
    t_box = Table(summary_box, colWidths=[504])
    t_box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#fef3c7")),
        ('BOX', (0,0), (-1,-1), 1, c_primary),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(t_box)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"✅ PDF successfully generated at: {filename}")

if __name__ == "__main__":
    out_pdf = os.path.join(os.getcwd(), "HOMEMADE_Protein_Complete_Master_Guide.pdf")
    build_pdf(out_pdf)
