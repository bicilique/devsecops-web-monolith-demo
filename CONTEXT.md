# MiniCart Admin

MiniCart Admin is workshop training application for learning DevSecOps against simple e-commerce admin monolith.

## Language

**MiniCart Admin**:
Workshop application used as scan, exploit, fix, and rescan target.
_Avoid_: demo app, web monolith demo

**Administrator**:
Primary human actor who logs in and manages catalog data.
_Avoid_: workshop user, operator

**User**:
Persistent authentication record used to identify who can sign in.
_Avoid_: account, administrator record

**Product**:
Catalog record managed by **Administrator** inside MiniCart Admin.
_Avoid_: item, SKU, merchandise record

**Audit Log**:
Historical record describing admin action taken against catalog data.
_Avoid_: event stream, debug log

## Relationships

- **Administrator** uses **MiniCart Admin** to manage product catalog
- **Administrator** is represented by one **User** record during authentication flow
- **Administrator** creates and updates **Product** records
- **Audit Log** records actions performed by **Administrator** against **Product**

## Example dialogue

> **Dev:** "When **Administrator** updates **Product**, what should dashboard history show?"
> **Domain expert:** "One **Audit Log** entry describing action against that **Product**."

## Flagged ambiguities

- "admin" used in roadmap and code; resolved: use **Administrator** in domain docs, `admin` in code identifiers when shorter name helps.
- "user" vs "administrator" was ambiguous; resolved: **User** is auth record type, **Administrator** is business actor using app.
- "audit log" vs generic app log was ambiguous; resolved: **Audit Log** means admin activity history, not runtime diagnostics.
