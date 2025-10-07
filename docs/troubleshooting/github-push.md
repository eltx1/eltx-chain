# GitHub Push & Pull Request Troubleshooting

This guide collects the most common reasons why a push or Pull Request creation can fail and how to recover quickly.

## 1. تأكد إن التغييرات متكومتة Locally
قبل أي Push لازم تتأكد إنك مثبت كل التغييرات على الفرع الحالي.

```bash
git status
```
لو في ملفات Modified اعمل commit:

```bash
git add .
git commit -m "feat: describe your change"
```

## 2. تأكد من الريموت والفرع
اتأكد إن الفرع عليه Remote tracking branch.

```bash
git remote -v
```
لو مش متضبط، ضيف الريموت:

```bash
git remote add origin git@github.com:ORG/REPO.git
```

بعدين ادفع الفرع الحالي لأول مرة مع `-u` عشان يتعمل Tracking:

```bash
git push -u origin <branch-name>
```

## 3. المصادقة (Tokens)
لو بتستخدم HTTPS، GitHub وقف دعم الباسوردات. لازم Personal Access Token (PAT) بالصلاحيات `repo`.

1. افتح https://github.com/settings/tokens
2. اعمل Token جديد (Classic أو Fine-grained).
3. لما `git push` يطلب باسورد، حط الـ Token مكانه.

للـ SSH اتأكد إن المفتاح متسجل:

```bash
ssh -T git@github.com
```

## 4. حل Error 400 لما تعمل Pull Request
رسالة زي `There is a problem with your request. (400, 989eddb4d803912e-PMO)` غالبًا معناها إن الـ PR ناقص بيانات أو الفرع مش متبوش.

- **اتأكد إن الفرع متبوش**: اعمل `git push origin <branch>`.
- **اتأكد إن الـ PR من Fork صح**: اختار الفرع المصدر والهدف في GitHub بوضوح.
- **امسح الكوكيز/جرب براوزر مختلف** لو كنت بتستخدم الموبايل، ساعات أبلكيشن GitHub Mobile بيرجع 400 مؤقت.
- **جرب من CLI**:

```bash
gh auth login --web
gh pr create --base main --head <branch> --title "feat: ..." --body "..."
```

## 5. التعامل مع ملفات ضخمة أو History كبير
لو GitHub رفض الـ Push بسبب الحجم:

- شيل الملفات الكبيرة واستعمل Git LFS لو لازم.
- تقدر تستخدم `git filter-repo` لتنضيف الـ History.

## 6. تقسيم التغييرات على ٣ Push متتالية
أحيانًا بيكون أسهل ترفع الشغل على دفعات صغيرة بدل Push واحد ضخم، خصوصًا لو الإنترنت ضعيف أو لو التطبيق (زي GitHub Mobile) بيهنج على عدد ملفات كبير. تقدر تقسم الريبو ده لثلاث دفعات بالشكل ده:

1. **الدفعة الأولى – البنية التحتية:**
   ```bash
   git checkout -b feature/split-push
   git add .env.example .gitignore LICENSE NOTICE infra/
   git commit -m "infra: add besu network and tooling"
   git push -u origin feature/split-push
   ```
   الدفعة دي فيها إعدادات Besu، Blockscout، والـ Reverse Proxy فهتتأكد إن الشبكة جاهزة لوحدها.

2. **الدفعة التانية – العقود والنشر:**
   ```bash
   git add contracts/ deploy/ ci/workflows/ci.yml
   git commit -m "contracts: add tokens, uniswap, and deploy suite"
   git push
   ```
   هنا هتضيف كل العقود (ELTX، USDTE، WELTX، Uniswap) مع سكريبتات Hardhat وCI.

3. **الدفعة التالتة – التطبيقات والدكات:**
   ```bash
   git add apps/ docs/ security/ README.md
   git commit -m "apps: add faucet, swap ui, and runbook docs"
   git push
   ```
   بتشمل الفوسيت، واجهة السواب، صفحة إضافة الشبكة، ودليل التهديدات.

بعد ما تعمل الـ ٣ Commits دي على نفس الفرع هتكون التغييرات كلها متقسمة بشكل منطقي، وتقدر تكمل إنشاء الـ PR عادي. لو حبيت تقسمهم على فروع منفصلة، كرر الخطوات لكل دفعة على فرع مستقل واعمل PR لكل واحد.

## 7. لو المشكلة استمرت
- راجع صفحة الحالة https://www.githubstatus.com/
- استنى شوية وحاول تاني (أحيانًا بيكون Maintenance).
- لو انت على شبكة فيها Proxy أو Firewall، اتأكد إن المنافذ 22 (SSH) و443 (HTTPS) مفتوحين.

## أوامر سريعة للمساعدة
```bash
# تغيير عنوان الريموت لو نقلت الريبو
git remote set-url origin git@github.com:ORG/REPO.git

# إعادة محاولة Push بعد الفشل
git push --force-with-lease

# فحص آخر Push نجح ولا لأ
git log origin/<branch> -1
```

باتباع الخطوات دي هتقدر تعرف سبب الخطأ وتصلحه بسرعة، سواء بتشتغل من اللابتوب أو حتى من الموبايل.
