

## Plan: Delete Test Gift Card Records

### Records to Delete
1. **Coupon** `GIFT-JYNUW8EG` (id: `69296782-cf50-40f0-bccb-53db3d0040f6`) — no redemptions exist, so no redemption records to clean up
2. **Purchase** record (id: `806b9a68-2229-4772-a557-03d976ee7cfe`, package: `gift_basic`, 5 credits, linked to this test)

### Method
A single database migration with two DELETE statements:

```sql
DELETE FROM coupons WHERE id = '69296782-cf50-40f0-bccb-53db3d0040f6';
DELETE FROM purchases WHERE id = '806b9a68-2229-4772-a557-03d976ee7cfe';
```

### What stays the same
Everything — no code changes, no schema changes. Only two data rows are removed.

