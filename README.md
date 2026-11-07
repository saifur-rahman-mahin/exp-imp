# Import–Export Handbook (GitHub Pages)

- `index.html` — ইন্ট্রো পেজ (ছয়টি বইয়ের কার্ড, "চালিয়ে যান")
- `shell.js` — প্রতিটা বইয়ে ডানদিকের ফ্লোটিং টুলবার (Shadow DOM, বইয়ের CSS/JS-এর সাথে সংঘর্ষ নেই)
- `books/` — ছয়টা বই; প্রতিটার শেষে শুধু `<script src="../shell.js" defer></script>` যোগ হয়েছে
- নতুন বই যোগ করতে: `books/` এ ফাইল রাখুন, শেষে ওই script লাইন দিন, আর `shell.js`-এর `BOOKS` তালিকায় একটি এন্ট্রি যোগ করুন

## GitHub Pages চালু করা
1. নতুন রিপো বানিয়ে এই ফোল্ডারের সব ফাইল রুটে পুশ করুন
2. Settings → Pages → Source: "Deploy from a branch" → `main` / `/ (root)`
3. কিছুক্ষণ পর `https://<username>.github.io/<repo>/` এ সাইট চালু হবে
