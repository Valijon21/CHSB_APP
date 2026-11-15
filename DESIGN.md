---
version: 1.0.0
name: CHSB Enterprise Design Tokens
description: Design specifications and visual tokens for CHSB Multi-Tenant Assessment Platform
colors:
  primary: "#0F766E"
  primary-hover: "#115E59"
  primary-light: "#CCFBF1"
  background: "#F8FAFC"
  surface: "#FFFFFF"
  surface-dark: "#1E293B"
  text-main: "#0F172A"
  text-muted: "#64748B"
  border: "#E2E8F0"
  border-dark: "#334155"
  success: "#10B981"
  warning: "#F59E0B"
  danger: "#EF4444"
typography:
  heading-lg:
    fontFamily: Inter, system-ui, sans-serif
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.2
  heading-md:
    fontFamily: Inter, system-ui, sans-serif
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: Inter, system-ui, sans-serif
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: Inter, system-ui, sans-serif
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.4
rounded:
  sm: 4px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
components:
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: 20px
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.lg}"
    padding: 10px 16px
---

# CHSB Assessment Platform Design Specification

## Overview
The CHSB Assessment Platform uses a clean, focused, professional interface designed for high readability in school assessments, proctoring, and administrative workflows.

## Colors
- **Teal / Emerald (`primary`):** Core brand and action color representing trust, precision, and education.
- **Slate (`text-main`, `text-muted`):** Modern high-contrast typography in light and dark modes.
- **Indigo / Emerald accents:** Secondary highlights for status and analytical insights.

## Typography
- System default sans-serif font stack (`Inter, system-ui, -apple-system, sans-serif`) with clear hierarchy from 12px badges to 24px view headings.

## Layout & Components
- Fully responsive card-based layout with accessible modals (`role="dialog"`, `aria-modal="true"`).
- Micro-interactions on buttons, clear focus states, and seamless dark mode support.
