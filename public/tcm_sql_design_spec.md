# 中醫處方實驗室 — 資料庫設計與查詢說明

[開啟網站](https://tab-etuc.github.io/tcm-sql-lab/) · [完整 ERD](./tcm_sql_erd.svg)

本文件由網站使用的欄位字典、固定資料與 SQL 題庫產生，樣本內容和查詢結果與網站共用同一份資料。

## 案例背景

中醫教學診所需要跨病例整理主訴、舌脈、症狀、證型與用方。醫師查找相同證型的病例，研究助理統計各證型與方劑的使用情形，學生透過修改 SQL 理解關聯查詢與結果差異。

病例資料依中國醫門診教學病例的欄位與詞彙編成 48 筆教學案例；方劑與藥材組成依衛福部文件整理。

## 資料庫設計

| 資料表 | 中文名稱 | 筆數 |
| --- | --- | --- |
| clinical_case | 病例 | 48 |
| syndrome | 證型 | 8 |
| case_syndrome | 病例 × 證型 | 54 |
| symptom | 症狀 | 24 |
| case_symptom | 病例 × 症狀 | 144 |
| formula | 方劑 | 10 |
| herb | 藥材 | 49 |
| formula_herb | 方劑 × 藥材 | 86 |
| case_formula | 病例 × 方劑 | 46 |

五張實體／字典表保存病例、證型、症狀、方劑與藥材；四張中介表保存多對多關聯。

```text
clinical_case 1 —— N case_syndrome N —— 1 syndrome
clinical_case 1 —— N case_symptom  N —— 1 symptom
clinical_case 1 —— N case_formula  N —— 1 formula
formula       1 —— N formula_herb N —— 1 herb
```

每筆中介表紀錄的兩個外來鍵都對應一筆主表紀錄，主表可對應 0 到多筆中介表紀錄。複合主鍵使每組配對唯一。主證部分唯一索引限制每例至多一筆主證，種子檢查確認每例恰有一筆。

症狀分成三種紀錄狀態：present 表示陽性、absent 表示明確陰性、缺少關聯列表示未記載。狀態屬於病例與症狀的關聯。

### 首頁示範病例

| 病例 | 年齡區間 | 主訴 | 證型 | 示例方 |
| --- | --- | --- | --- | --- |
| CASE-003 | 50–59 | 失眠、脅痛、便溏。 | 肝鬱脾虛（主證）、氣血兩虛（次證） | 逍遙散 |
| CASE-016 | 30–39 | 失眠、食慾不振。否認頭痛。 | 氣血兩虛（主證）、肝鬱脾虛（次證） | 八珍湯 |
| CASE-035 | 18–29 | 失眠、倦怠、頭暈。 | 心脾兩虛（主證） | 歸脾湯 |
| CASE-011 | 40–49 | 腹脹、食慾不振、易怒。 | 肝鬱脾虛（主證） | 尚無處方 |

### 病例 · clinical_case

一列代表一筆教學門診病例，以 CASE 編號連接證型、症狀與方劑。

| 欄位 | 型別 | 限制 | 說明 |
| --- | --- | --- | --- |
| case_id | TEXT | PK | 教學編號 CASE-001…CASE-048 |
| age_group | TEXT | NOT NULL · CHECK | 18–29、30–39、40–49、50–59、60+ |
| tcm_disease | TEXT | NOT NULL | 中醫病名／主訴分類 |
| chief_complaint | TEXT | NOT NULL | 主訴，與症狀觀察標籤一致 |
| present_illness | TEXT | NOT NULL | 改寫病程，含明確否認及未記載狀態 |
| tongue | TEXT | NOT NULL | 舌象摘要 |
| pulse | TEXT | NOT NULL | 脈象摘要 |

樣本資料（前 3 筆）：

| case_id | age_group | tcm_disease | chief_complaint | present_illness | tongue | pulse |
| --- | --- | --- | --- | --- | --- | --- |
| CASE-001 | 18–29 | 脅痛 | 腹脹、食慾不振、易怒。 | 教學情境：記錄腹脹、食慾不振、易怒，症狀反覆。其餘症狀未記載。 | 舌淡紅、苔薄白 | 脈弦細 |
| CASE-002 | 30–39 | 脅痛 | 食慾不振、易怒。否認頭痛。 | 教學情境：記錄食慾不振、易怒，症狀反覆。問診明確否認頭痛。其餘症狀未記載。 | 舌淡紅、苔薄白 | 脈弦細 |
| CASE-003 | 50–59 | 不寐 | 失眠、脅痛、便溏。 | 教學情境：記錄失眠、脅痛、便溏，症狀反覆。其餘症狀未記載。 | 舌淡紅、苔薄白 | 脈弦細 |

### 證型 · syndrome

證型名稱集中維護；主證或次證是病例關聯的屬性。

| 欄位 | 型別 | 限制 | 說明 |
| --- | --- | --- | --- |
| syndrome_id | TEXT | PK | 證型編號 |
| syndrome_name | TEXT | UNIQUE · NOT NULL | 正規化證型名稱 |
| description | TEXT | NOT NULL | 教學說明 |

樣本資料（前 3 筆）：

| syndrome_id | syndrome_name | description |
| --- | --- | --- |
| SY-01 | 肝鬱脾虛 | 情志與脾胃表現相關的教學證型。 |
| SY-02 | 氣血兩虛 | 以氣與血不足的描述建立教學分類。 |
| SY-03 | 脾胃濕熱 | 以脾胃與濕熱表現建立教學分類。 |

### 病例 × 證型 · case_syndrome

複合主鍵避免重複；部分唯一索引限制每筆病例至多一個主證。種子驗證每例恰有一個主證。

| 欄位 | 型別 | 限制 | 說明 |
| --- | --- | --- | --- |
| case_id | TEXT | PK · FK | → clinical_case.case_id |
| syndrome_id | TEXT | PK · FK | → syndrome.syndrome_id |
| syndrome_role | TEXT | NOT NULL · CHECK | primary 主證／secondary 次證 |

樣本資料（前 3 筆）：

| case_id | syndrome_id | syndrome_role |
| --- | --- | --- |
| CASE-001 | SY-01 | primary |
| CASE-002 | SY-01 | primary |
| CASE-003 | SY-01 | primary |

### 症狀 · symptom

同一個症狀名稱只存一次，有無症狀記錄在關聯表。

| 欄位 | 型別 | 限制 | 說明 |
| --- | --- | --- | --- |
| symptom_id | TEXT | PK | 症狀編號 |
| symptom_name | TEXT | UNIQUE · NOT NULL | 症狀名稱 |
| category | TEXT | NOT NULL | 睡眠、情志、飲食、二便、頭身等 |

樣本資料（前 3 筆）：

| symptom_id | symptom_name | category |
| --- | --- | --- |
| SM-01 | 失眠 | 睡眠 |
| SM-02 | 腹脹 | 飲食 |
| SM-03 | 食慾不振 | 飲食 |

### 病例 × 症狀 · case_symptom

present 表示有症狀，absent 表示明確否認；沒有關聯列代表未記載。

| 欄位 | 型別 | 限制 | 說明 |
| --- | --- | --- | --- |
| case_id | TEXT | PK · FK | → clinical_case.case_id |
| symptom_id | TEXT | PK · FK | → symptom.symptom_id |
| status | TEXT | NOT NULL · CHECK | present 為陽性、absent 為明確陰性 |

樣本資料（前 3 筆）：

| case_id | symptom_id | status |
| --- | --- | --- |
| CASE-001 | SM-02 | present |
| CASE-001 | SM-03 | present |
| CASE-001 | SM-21 | present |

### 方劑 · formula

未使用的方劑仍保留，才能藉 LEFT JOIN 看見零次使用。

| 欄位 | 型別 | 限制 | 說明 |
| --- | --- | --- | --- |
| formula_id | TEXT | PK | 方劑編號 |
| formula_name | TEXT | UNIQUE · NOT NULL | 正規化方名 |
| category | TEXT | NOT NULL | 來源所載方劑分類 |
| reference_source | TEXT | NOT NULL | 古籍出處與查核文件 |

樣本資料（前 3 筆）：

| formula_id | formula_name | category | reference_source |
| --- | --- | --- | --- |
| FM-01 | 逍遙散 | 和解之劑 | 《太平惠民和劑局方》；衛福部《中藥常用方劑效能、適應症語意解析及英譯彙編》 |
| FM-02 | 八珍湯 | 補養之劑 | 《證治準繩》；衛福部《臺灣中藥典第四版》基準方 |
| FM-03 | 甘露消毒丹 | 清熱瀉火之劑 | 《醫效秘傳》；衛福部《中藥常用方劑效能、適應症語意解析及英譯彙編》 |

### 藥材 · herb

藥材與炮製品名稱分列，如甘草與炙甘草。未查核的分類為 NULL。

| 欄位 | 型別 | 限制 | 說明 |
| --- | --- | --- | --- |
| herb_id | TEXT | PK | 藥材編號 |
| herb_name | TEXT | UNIQUE · NOT NULL | 保留來源組成名稱 |
| category | TEXT | NULL | 沒有分類佐證，保留空值 |
| reference_source | TEXT | NOT NULL | 組成字典來源 |

樣本資料（前 3 筆）：

| herb_id | herb_name | category | reference_source |
| --- | --- | --- | --- |
| HB-01 | 炙甘草 | NULL | 依十方來源組成名稱整理；炮製品分列 |
| HB-02 | 白芍 | NULL | 依十方來源組成名稱整理；炮製品分列 |
| HB-03 | 當歸 | NULL | 依十方來源組成名稱整理；炮製品分列 |

### 方劑 × 藥材 · formula_herb

拆解方劑的多對多組成；ingredient_order 保留來源呈現順序。

| 欄位 | 型別 | 限制 | 說明 |
| --- | --- | --- | --- |
| formula_id | TEXT | PK · FK | → formula.formula_id |
| herb_id | TEXT | PK · FK | → herb.herb_id |
| ingredient_order | INTEGER | NOT NULL · CHECK > 0 | 組成顯示順序；同方順序唯一 |

樣本資料（前 3 筆）：

| formula_id | herb_id | ingredient_order |
| --- | --- | --- |
| FM-01 | HB-01 | 1 |
| FM-01 | HB-02 | 2 |
| FM-01 | HB-03 | 3 |

### 病例 × 方劑 · case_formula

一例可關聯多方；本教學資料每例至多一方，兩例完全沒有用方記錄。

| 欄位 | 型別 | 限制 | 說明 |
| --- | --- | --- | --- |
| case_id | TEXT | PK · FK | → clinical_case.case_id |
| formula_id | TEXT | PK · FK | → formula.formula_id |
| formula_role | TEXT | NOT NULL | 教學病例所連結的示例方 |

樣本資料（前 3 筆）：

| case_id | formula_id | formula_role |
| --- | --- | --- |
| CASE-001 | FM-01 | 示例方 |
| CASE-002 | FM-01 | 示例方 |
| CASE-003 | FM-01 | 示例方 |

## 查詢操作與結果比較

選擇題目後可編輯 SQL、執行查詢、切換預期與實際結果。每題提供修改範例；比較頁同時呈現兩段 SQL、兩側結果、資料列增減及原因。「我的 SQL」使用目前編輯器草稿。「只看差異資料」篩選變更列，完整結果可隨時切回。

| 題目 | SQL 重點 | 原版列數 | 修改列數 |
| --- | --- | --- | --- |
| Q01 找出 50 歲以上的病例 | WHERE、IN | 14 | 26 |
| Q02 主證為肝鬱脾虛的病例 | JOIN、WHERE | 12 | 13 |
| Q03 明確記載失眠的病例 | JOIN、AND | 9 | 13 |
| Q04 一份病例，有幾個證型？ | JOIN、一對多 | 54 | 48 |
| Q05 各主證分別有多少病例？ | GROUP BY、COUNT | 8 | 1 |
| Q06 篩出至少 7 例的主證 | HAVING、COUNT | 3 | 5 |
| Q07 拆解逍遙散的藥材組成 | JOIN、ORDER BY | 8 | 12 |
| Q08 找出從未使用的方劑 | LEFT JOIN、IS NULL | 2 | 0 |
| Q09 同時含當歸與炙甘草的方劑 | HAVING、DISTINCT | 3 | 6 |
| Q10 方劑使用次數，包含零次 | LEFT JOIN、COUNT | 10 | 10 |
| Q11 從當歸，追溯到使用病例 | 多表 JOIN、DISTINCT | 24 | 34 |
| Q12 哪些病例尚無處方紀錄？ | NOT EXISTS、NULL | 2 | 0 |

### Q01 · 找出 50 歲以上的病例

研究助理想先檢視 50 歲以上的教學病例。請列出病例編號、年齡區間與中醫病名。

#### 原版：50 歲以上

```sql
SELECT case_id AS 病例編號,
       age_group AS 年齡區間,
       tcm_disease AS 中醫病名
FROM clinical_case
WHERE age_group IN ('50–59', '60+')
ORDER BY case_id;
```

結果：**14 列**。以下列出前 5 列；完整結果可在網站執行查看。

| 病例編號 | 年齡區間 | 中醫病名 |
| --- | --- | --- |
| CASE-003 | 50–59 | 不寐 |
| CASE-006 | 50–59 | 脅痛 |
| CASE-009 | 50–59 | 脅痛 |
| CASE-012 | 60+ | 脅痛 |
| CASE-015 | 60+ | 虛勞 |

#### 修改版：40 歲以上

```sql
SELECT case_id AS 病例編號,
       age_group AS 年齡區間,
       tcm_disease AS 中醫病名
FROM clinical_case
WHERE age_group IN ('40–49', '50–59', '60+')
ORDER BY case_id;
```

結果：**26 列**。以下列出前 5 列；完整結果可在網站執行查看。

| 病例編號 | 年齡區間 | 中醫病名 |
| --- | --- | --- |
| CASE-003 | 50–59 | 不寐 |
| CASE-006 | 50–59 | 脅痛 |
| CASE-008 | 40–49 | 脅痛 |
| CASE-009 | 50–59 | 脅痛 |
| CASE-011 | 40–49 | 脅痛 |

**結果解釋**：把 40–49 加入 IN 清單，會多納入這個年齡區間的 12 筆病例。原本的 14 筆仍符合條件，所以總數變成 26 筆。

**讀懂 SQL**：

1. FROM 指定病例表。
2. WHERE 以年齡區間篩選；文字區間用 IN 明確列舉。
3. ORDER BY 讓病例依編號排列，方便比較。

**學習重點**：年齡區間以文字分類儲存，使用 IN 列舉要納入的區間。

### Q02 · 主證為肝鬱脾虛的病例

中醫師希望查閱主證為肝鬱脾虛的病例。請透過病例證型關聯，列出病例編號、年齡區間與證型。

#### 原版：只納入主證

```sql
SELECT c.case_id AS 病例編號,
       c.age_group AS 年齡區間,
       s.syndrome_name AS 證型
FROM clinical_case AS c
JOIN case_syndrome AS cs ON c.case_id = cs.case_id
JOIN syndrome AS s ON cs.syndrome_id = s.syndrome_id
WHERE s.syndrome_name = '肝鬱脾虛'
  AND cs.syndrome_role = 'primary'
ORDER BY c.case_id;
```

結果：**12 列**。以下列出前 5 列；完整結果可在網站執行查看。

| 病例編號 | 年齡區間 | 證型 |
| --- | --- | --- |
| CASE-001 | 18–29 | 肝鬱脾虛 |
| CASE-002 | 30–39 | 肝鬱脾虛 |
| CASE-003 | 50–59 | 肝鬱脾虛 |
| CASE-004 | 18–29 | 肝鬱脾虛 |
| CASE-005 | 30–39 | 肝鬱脾虛 |

#### 修改版：主證、次證皆納入

```sql
SELECT c.case_id AS 病例編號,
       c.age_group AS 年齡區間,
       s.syndrome_name AS 證型
FROM clinical_case AS c
JOIN case_syndrome AS cs ON c.case_id = cs.case_id
JOIN syndrome AS s ON cs.syndrome_id = s.syndrome_id
WHERE s.syndrome_name = '肝鬱脾虛'
ORDER BY c.case_id;
```

結果：**13 列**。以下列出前 5 列；完整結果可在網站執行查看。

| 病例編號 | 年齡區間 | 證型 |
| --- | --- | --- |
| CASE-001 | 18–29 | 肝鬱脾虛 |
| CASE-002 | 30–39 | 肝鬱脾虛 |
| CASE-003 | 50–59 | 肝鬱脾虛 |
| CASE-004 | 18–29 | 肝鬱脾虛 |
| CASE-005 | 30–39 | 肝鬱脾虛 |

**結果解釋**：移除主證條件後，CASE-016 以次證「肝鬱脾虛」加入結果。JOIN 只配對關聯，是否只取主證必須明確寫入 WHERE。

**讀懂 SQL**：

1. JOIN 將病例連到中介表，再連到證型字典。
2. 用 syndrome_name 指定證型。
3. syndrome_role 限制這個證型在病例中必須是主證。

**學習重點**：同一個證型，在不同病例裡可能扮演不同角色。

### Q03 · 明確記載失眠的病例

研究助理需要有「失眠」陽性症狀的病例。請排除明確否認失眠的紀錄，並顯示症狀狀態。

#### 原版：有失眠（present）

```sql
SELECT c.case_id AS 病例編號,
       c.chief_complaint AS 主訴,
       cs.status AS 症狀狀態
FROM clinical_case AS c
JOIN case_symptom AS cs ON c.case_id = cs.case_id
JOIN symptom AS s ON cs.symptom_id = s.symptom_id
WHERE s.symptom_name = '失眠'
  AND cs.status = 'present'
ORDER BY c.case_id;
```

結果：**9 列**。以下列出前 5 列；完整結果可在網站執行查看。

| 病例編號 | 主訴 | 症狀狀態 |
| --- | --- | --- |
| CASE-003 | 失眠、脅痛、便溏。 | present |
| CASE-007 | 失眠、易怒、脅痛。 | present |
| CASE-016 | 失眠、食慾不振。否認頭痛。 | present |
| CASE-020 | 失眠、心悸。否認頭痛。 | present |
| CASE-035 | 失眠、倦怠、頭暈。 | present |

#### 修改版：忽略症狀狀態

```sql
SELECT c.case_id AS 病例編號,
       c.chief_complaint AS 主訴,
       cs.status AS 症狀狀態
FROM clinical_case AS c
JOIN case_symptom AS cs ON c.case_id = cs.case_id
JOIN symptom AS s ON cs.symptom_id = s.symptom_id
WHERE s.symptom_name = '失眠'
ORDER BY c.case_id;
```

結果：**13 列**。以下列出前 5 列；完整結果可在網站執行查看。

| 病例編號 | 主訴 | 症狀狀態 |
| --- | --- | --- |
| CASE-003 | 失眠、脅痛、便溏。 | present |
| CASE-007 | 失眠、易怒、脅痛。 | present |
| CASE-010 | 腹脹、食慾不振。否認失眠。 | absent |
| CASE-016 | 失眠、食慾不振。否認頭痛。 | present |
| CASE-018 | 頭暈、氣短。否認失眠。 | absent |

**結果解釋**：多出 4 筆 status = absent 的病例。它們的症狀狀態是「否認失眠」。其餘 35 筆的失眠觀察狀態為未記載。

**讀懂 SQL**：

1. 找到名稱為失眠的症狀。
2. 透過中介表找出曾記錄此症狀的病例。
3. 再用 present 排除陰性記錄。

**學習重點**：present、absent、未記載是三種不同意思。

### Q04 · 一份病例，有幾個證型？

列出所有病例及其主證與次證，觀察為什麼 48 筆病例 JOIN 後可以得到超過 48 列。

#### 原版：所有證型關聯

```sql
SELECT c.case_id AS 病例編號,
       s.syndrome_name AS 證型,
       cs.syndrome_role AS 主次證
FROM clinical_case AS c
JOIN case_syndrome AS cs ON c.case_id = cs.case_id
JOIN syndrome AS s ON cs.syndrome_id = s.syndrome_id
ORDER BY c.case_id, cs.syndrome_role;
```

結果：**54 列**。以下列出前 5 列；完整結果可在網站執行查看。

| 病例編號 | 證型 | 主次證 |
| --- | --- | --- |
| CASE-001 | 肝鬱脾虛 | primary |
| CASE-002 | 肝鬱脾虛 | primary |
| CASE-003 | 肝鬱脾虛 | primary |
| CASE-003 | 氣血兩虛 | secondary |
| CASE-004 | 肝鬱脾虛 | primary |

#### 修改版：僅主證關聯

```sql
SELECT c.case_id AS 病例編號,
       s.syndrome_name AS 證型,
       cs.syndrome_role AS 主次證
FROM clinical_case AS c
JOIN case_syndrome AS cs ON c.case_id = cs.case_id
JOIN syndrome AS s ON cs.syndrome_id = s.syndrome_id
WHERE cs.syndrome_role = 'primary'
ORDER BY c.case_id, cs.syndrome_role;
```

結果：**48 列**。以下列出前 5 列；完整結果可在網站執行查看。

| 病例編號 | 證型 | 主次證 |
| --- | --- | --- |
| CASE-001 | 肝鬱脾虛 | primary |
| CASE-002 | 肝鬱脾虛 | primary |
| CASE-003 | 肝鬱脾虛 | primary |
| CASE-004 | 肝鬱脾虛 | primary |
| CASE-005 | 肝鬱脾虛 | primary |

**結果解釋**：48 筆病例各有一個主證，另有 6 個次證關聯。JOIN 輸出的是配對列，所以有 54 列；限制 primary 後剩下 48 列。

**讀懂 SQL**：

1. 由病例走到 case_syndrome。
2. 一個病例有兩個證型就輸出兩列。
3. 保留 syndrome_role，清楚解釋每一列的角色。

**學習重點**：COUNT(*) 計算關聯列數，COUNT(DISTINCT case_id) 計算病例數。

### Q05 · 各主證分別有多少病例？

研究助理要統計各主證的病例數，並由多到少排列。只計 primary，避免次證重複計入。

#### 原版：每個證型分組

```sql
SELECT s.syndrome_name AS 證型,
       COUNT(*) AS 病例數
FROM syndrome AS s
JOIN case_syndrome AS cs ON s.syndrome_id = cs.syndrome_id
WHERE cs.syndrome_role = 'primary'
GROUP BY s.syndrome_id, s.syndrome_name
ORDER BY 病例數 DESC, s.syndrome_id;
```

結果：**8 列**。以下列出前 5 列；完整結果可在網站執行查看。

| 證型 | 病例數 |
| --- | --- |
| 肝鬱脾虛 | 12 |
| 氣血兩虛 | 9 |
| 脾胃濕熱 | 7 |
| 肝胃不和 | 6 |
| 心脾兩虛 | 5 |

#### 修改版：全部主證合計

```sql
SELECT COUNT(*) AS 總病例數
FROM case_syndrome
WHERE syndrome_role = 'primary';
```

結果：**1 列**。

| 總病例數 |
| --- |
| 48 |

**結果解釋**：GROUP BY 把 48 筆主證分成 8 組，分別是 12、9、7、6、5、4、3、2 筆。不分組則只有一列總計 48。修改版也移除證型名稱，避免 SQLite 的非分組欄位顯示任意名稱。

**讀懂 SQL**：

1. 先用 WHERE 留下主證。
2. GROUP BY 用證型編號與名稱分組。
3. COUNT(*) 統計每一組的關聯列數。

**學習重點**：拿掉 GROUP BY 時，也要重新考慮 SELECT 的顯示欄位。

### Q06 · 篩出至少 7 例的主證

只顯示病例數至少 7 筆的主證。分組後的條件應放在 HAVING。

#### 原版：至少 7 例

```sql
SELECT s.syndrome_name AS 證型,
       COUNT(*) AS 病例數
FROM syndrome AS s
JOIN case_syndrome AS cs ON s.syndrome_id = cs.syndrome_id
WHERE cs.syndrome_role = 'primary'
GROUP BY s.syndrome_id, s.syndrome_name
HAVING COUNT(*) >= 7
ORDER BY 病例數 DESC, s.syndrome_id;
```

結果：**3 列**。

| 證型 | 病例數 |
| --- | --- |
| 肝鬱脾虛 | 12 |
| 氣血兩虛 | 9 |
| 脾胃濕熱 | 7 |

#### 修改版：至少 5 例

```sql
SELECT s.syndrome_name AS 證型,
       COUNT(*) AS 病例數
FROM syndrome AS s
JOIN case_syndrome AS cs ON s.syndrome_id = cs.syndrome_id
WHERE cs.syndrome_role = 'primary'
GROUP BY s.syndrome_id, s.syndrome_name
HAVING COUNT(*) >= 5
ORDER BY 病例數 DESC, s.syndrome_id;
```

結果：**5 列**。

| 證型 | 病例數 |
| --- | --- |
| 肝鬱脾虛 | 12 |
| 氣血兩虛 | 9 |
| 脾胃濕熱 | 7 |
| 肝胃不和 | 6 |
| 心脾兩虛 | 5 |

**結果解釋**：門檻從 7 降到 5，會多納入肝胃不和（6 例）與心脾兩虛（5 例）。WHERE 先篩資料列；HAVING 再篩聚合後的組別。

**讀懂 SQL**：

1. WHERE 先限制 primary。
2. GROUP BY 形成每一個證型的組別。
3. HAVING 在 COUNT 完成後篩選組別。

**學習重點**：WHERE 篩列；HAVING 篩組。

### Q07 · 拆解逍遙散的藥材組成

查出逍遙散有哪些組成藥材，依照來源記錄的組成順序顯示。

#### 原版：逍遙散

```sql
SELECT h.herb_name AS 藥材名稱,
       fh.ingredient_order AS 組成順序
FROM formula AS f
JOIN formula_herb AS fh ON f.formula_id = fh.formula_id
JOIN herb AS h ON fh.herb_id = h.herb_id
WHERE f.formula_name = '逍遙散'
ORDER BY fh.ingredient_order;
```

結果：**8 列**。以下列出前 5 列；完整結果可在網站執行查看。

| 藥材名稱 | 組成順序 |
| --- | --- |
| 炙甘草 | 1 |
| 白芍 | 2 |
| 當歸 | 3 |
| 茯苓 | 4 |
| 白朮 | 5 |

#### 修改版：歸脾湯

```sql
SELECT h.herb_name AS 藥材名稱,
       fh.ingredient_order AS 組成順序
FROM formula AS f
JOIN formula_herb AS fh ON f.formula_id = fh.formula_id
JOIN herb AS h ON fh.herb_id = h.herb_id
WHERE f.formula_name = '歸脾湯'
ORDER BY fh.ingredient_order;
```

結果：**12 列**。以下列出前 5 列；完整結果可在網站執行查看。

| 藥材名稱 | 組成順序 |
| --- | --- |
| 人參 | 1 |
| 龍眼肉 | 2 |
| 黃耆 | 3 |
| 炙甘草 | 4 |
| 白朮 | 5 |

**結果解釋**：兩次使用完全相同的三表 JOIN，只更換方劑名稱。來源字典記錄逍遙散 8 個組成、歸脾湯 12 個組成；包含薑棗等來源列出的組成。比較以「藥材名稱＋組成順序」為一列，同名藥材的順序改變時，也會呈現一列移除與一列新增。

**讀懂 SQL**：

1. formula 找到方劑。
2. formula_herb 取得其藥材編號與順序。
3. herb 將編號換成可讀的藥材名稱。

**學習重點**：同一個 JOIN 路徑可以回答不同方劑的組成問題。

### Q08 · 找出從未使用的方劑

保留所有方劑，找出沒有任何病例用方紀錄的方劑。

#### 原版：LEFT JOIN

```sql
SELECT f.formula_id AS 方劑編號,
       f.formula_name AS 方劑名稱
FROM formula AS f
LEFT JOIN case_formula AS cf ON f.formula_id = cf.formula_id
WHERE cf.case_id IS NULL
ORDER BY f.formula_id;
```

結果：**2 列**。

| 方劑編號 | 方劑名稱 |
| --- | --- |
| FM-09 | 六味地黃丸 |
| FM-10 | 一貫煎 |

#### 修改版：INNER JOIN

```sql
SELECT f.formula_id AS 方劑編號,
       f.formula_name AS 方劑名稱
FROM formula AS f
INNER JOIN case_formula AS cf ON f.formula_id = cf.formula_id
WHERE cf.case_id IS NULL
ORDER BY f.formula_id;
```

結果：**0 列**。

| 方劑編號 | 方劑名稱 |
| --- | --- |

此查詢得到 0 列。

**結果解釋**：六味地黃丸與一貫煎沒有病例關聯。LEFT JOIN 保留兩方，右側 case_id 為 NULL；INNER JOIN 先把未配對的方劑排除，之後再找 NULL 就沒有結果。

**讀懂 SQL**：

1. 從完整方劑字典出發。
2. LEFT JOIN 保留未配對的左表資料。
3. 用右表主鍵 IS NULL 識別無關聯者。

**學習重點**：查詢零筆關聯時，先用 LEFT JOIN 保留左表資料，再以 IS NULL 篩選。

### Q09 · 同時含當歸與炙甘草的方劑

找出同時具有當歸和炙甘草的方劑，注意這兩種藥材會出現在不同的組成列。

#### 原版：兩種都包含

```sql
SELECT f.formula_name AS 方劑名稱
FROM formula AS f
JOIN formula_herb AS fh ON f.formula_id = fh.formula_id
JOIN herb AS h ON fh.herb_id = h.herb_id
WHERE h.herb_name IN ('當歸', '炙甘草')
GROUP BY f.formula_id, f.formula_name
HAVING COUNT(DISTINCT h.herb_id) = 2
ORDER BY f.formula_id;
```

結果：**3 列**。

| 方劑名稱 |
| --- |
| 逍遙散 |
| 八珍湯 |
| 歸脾湯 |

#### 修改版：至少包含一種

```sql
SELECT f.formula_name AS 方劑名稱
FROM formula AS f
JOIN formula_herb AS fh ON f.formula_id = fh.formula_id
JOIN herb AS h ON fh.herb_id = h.herb_id
WHERE h.herb_name IN ('當歸', '炙甘草')
GROUP BY f.formula_id, f.formula_name
HAVING COUNT(DISTINCT h.herb_id) >= 1
ORDER BY f.formula_id;
```

結果：**6 列**。以下列出前 5 列；完整結果可在網站執行查看。

| 方劑名稱 |
| --- |
| 逍遙散 |
| 八珍湯 |
| 小柴胡湯 |
| 歸脾湯 |
| 二陳湯 |

**結果解釋**：WHERE IN 先保留兩種候選藥材，HAVING COUNT(DISTINCT) = 2 要求兩種都有，得到逍遙散、八珍湯、歸脾湯。改成 >= 1，另加入小柴胡湯、二陳湯、一貫煎。

**讀懂 SQL**：

1. IN 在每列保留當歸或炙甘草。
2. 按方劑分組，把不同組成列放回同一組。
3. COUNT(DISTINCT) = 2 檢查兩種藥材是否齊全。

**學習重點**：一列的藥材名稱不可能同時等於兩個名稱；「皆包含」需跨列聚合。

### Q10 · 方劑使用次數，包含零次

統計每種方劑被幾份病例使用。未使用的方劑也必須顯示 0。

#### 原版：COUNT(cf.case_id)

```sql
SELECT f.formula_name AS 方劑名稱,
       COUNT(cf.case_id) AS 使用次數
FROM formula AS f
LEFT JOIN case_formula AS cf ON f.formula_id = cf.formula_id
GROUP BY f.formula_id, f.formula_name
ORDER BY 使用次數 DESC, f.formula_id;
```

結果：**10 列**。以下列出前 5 列；完整結果可在網站執行查看。

| 方劑名稱 | 使用次數 |
| --- | --- |
| 逍遙散 | 10 |
| 八珍湯 | 9 |
| 甘露消毒丹 | 7 |
| 小柴胡湯 | 6 |
| 歸脾湯 | 5 |

#### 修改版：COUNT(*)

```sql
SELECT f.formula_name AS 方劑名稱,
       COUNT(*) AS 使用次數
FROM formula AS f
LEFT JOIN case_formula AS cf ON f.formula_id = cf.formula_id
GROUP BY f.formula_id, f.formula_name
ORDER BY 使用次數 DESC, f.formula_id;
```

結果：**10 列**。以下列出前 5 列；完整結果可在網站執行查看。

| 方劑名稱 | 使用次數 |
| --- | --- |
| 逍遙散 | 10 |
| 八珍湯 | 9 |
| 甘露消毒丹 | 7 |
| 小柴胡湯 | 6 |
| 歸脾湯 | 5 |

**結果解釋**：兩次結果都有 10 列，但兩個未使用方劑的計數由 0 變為 1。COUNT(欄位) 忽略 NULL；COUNT(*) 會把 LEFT JOIN 為未配對方劑保留的空配對列也算進去。

**讀懂 SQL**：

1. LEFT JOIN 讓十個方劑都保留。
2. 以方劑分組。
3. COUNT(cf.case_id) 計算右表有值的病例編號。

**學習重點**：比較結果時，同時查看列數與各儲存格的內容。

### Q11 · 從當歸，追溯到使用病例

沿著病例、方劑、組成與藥材的關聯，找出使用過含當歸方劑的病例。

#### 原版：方劑含當歸

```sql
SELECT DISTINCT c.case_id AS 病例編號,
       c.age_group AS 年齡區間,
       c.tcm_disease AS 中醫病名
FROM clinical_case AS c
JOIN case_formula AS cf ON c.case_id = cf.case_id
JOIN formula_herb AS fh ON cf.formula_id = fh.formula_id
JOIN herb AS h ON fh.herb_id = h.herb_id
WHERE h.herb_name = '當歸'
ORDER BY c.case_id;
```

結果：**24 列**。以下列出前 5 列；完整結果可在網站執行查看。

| 病例編號 | 年齡區間 | 中醫病名 |
| --- | --- | --- |
| CASE-001 | 18–29 | 脅痛 |
| CASE-002 | 30–39 | 脅痛 |
| CASE-003 | 50–59 | 不寐 |
| CASE-004 | 18–29 | 脅痛 |
| CASE-005 | 30–39 | 脅痛 |

#### 修改版：方劑含炙甘草

```sql
SELECT DISTINCT c.case_id AS 病例編號,
       c.age_group AS 年齡區間,
       c.tcm_disease AS 中醫病名
FROM clinical_case AS c
JOIN case_formula AS cf ON c.case_id = cf.case_id
JOIN formula_herb AS fh ON cf.formula_id = fh.formula_id
JOIN herb AS h ON fh.herb_id = h.herb_id
WHERE h.herb_name = '炙甘草'
ORDER BY c.case_id;
```

結果：**34 列**。以下列出前 5 列；完整結果可在網站執行查看。

| 病例編號 | 年齡區間 | 中醫病名 |
| --- | --- | --- |
| CASE-001 | 18–29 | 脅痛 |
| CASE-002 | 30–39 | 脅痛 |
| CASE-003 | 50–59 | 不寐 |
| CASE-004 | 18–29 | 脅痛 |
| CASE-005 | 30–39 | 脅痛 |

**結果解釋**：含當歸且曾使用的方劑是逍遙散、八珍湯、歸脾湯，共 24 例；改成炙甘草再加小柴胡湯 6 例、二陳湯 4 例，成為 34 例。一貫煎雖含當歸，但沒有病例使用。

**讀懂 SQL**：

1. case_formula 把病例連到使用方劑。
2. formula_herb 把方劑展開成組成。
3. 用藥材名稱篩選，DISTINCT 避免未來多方資料重複列出同一病例。

**學習重點**：多表 JOIN 可以從最末端的藥材條件追溯到最上游的病例。

### Q12 · 哪些病例尚無處方紀錄？

列出沒有任何用方紀錄的病例，用 NOT EXISTS 表達「不存在符合的關聯」。

#### 原版：NOT EXISTS

```sql
SELECT c.case_id AS 病例編號,
       c.chief_complaint AS 主訴
FROM clinical_case AS c
WHERE NOT EXISTS (
  SELECT 1 FROM case_formula AS cf
  WHERE cf.case_id = c.case_id
)
ORDER BY c.case_id;
```

結果：**2 列**。

| 病例編號 | 主訴 |
| --- | --- |
| CASE-011 | 腹脹、食慾不振、易怒。 |
| CASE-012 | 食慾不振、易怒。否認頭痛。 |

#### 修改版：INNER JOIN 再找 NULL

```sql
SELECT c.case_id AS 病例編號,
       c.chief_complaint AS 主訴
FROM clinical_case AS c
INNER JOIN case_formula AS cf ON c.case_id = cf.case_id
WHERE cf.case_id IS NULL
ORDER BY c.case_id;
```

結果：**0 列**。

| 病例編號 | 主訴 |
| --- | --- |

此查詢得到 0 列。

**結果解釋**：CASE-011 與 CASE-012 沒有處方關聯。NOT EXISTS 逐筆檢查是否沒有對應紀錄；INNER JOIN 會先排除這兩筆，因此後續 IS NULL 篩選得到 0 筆。

**讀懂 SQL**：

1. 逐一檢視病例。
2. 子查詢以相同 case_id 檢查用方紀錄。
3. NOT EXISTS 在沒有任何配對時才保留病例。

**學習重點**：NOT EXISTS 與 LEFT JOIN / IS NULL 都能表達反連結。

## 執行方式

GitHub Pages 提供靜態網站。sql.js 將 SQLite 編譯成 WebAssembly，在瀏覽器 Web Worker 執行查詢。每次查詢重新載入固定種子；基準答案亦由 SQLite 實際執行取得。

實驗室接受唯讀查詢，每次最多 2,000 列與八組結果，畫面顯示最後一組。查詢可手動停止，超過八秒會自動停止。語法、欄位或資料表錯誤會顯示原生 SQLite 訊息及中文提示。CSV 下載對應目前選取的預期／實際結果分頁；SQLite 與建表 SQL 可從網站下載。

結果比較保留重複列次數；欄位結構不同時先提示對齊欄位。資料相同而排序不同時會標示排序差異。每題草稿與完成進度保存在目前瀏覽器。

## 資料來源

- 中國醫門診教學病例：以症狀、證型、舌象與脈象欄位為參考，編成 48 筆教學病例，連結年齡區間、主次證與示例方劑。
- [中藥常用方劑語意解析及英譯彙編](https://www.mohw.gov.tw/dl-69997-92bcd2d5-5987-48d1-a15e-ffb2185fb1e7.html)：方劑分類、出處與藥材組成。逍遙散參照 PDF 第 68–69 頁；歸脾湯第 96 頁。
- [臺灣中藥典第四版](https://www.mohw.gov.tw/dl-71936-0a89f40d-7558-4ab2-8f4b-55e58de6552b.html)：八珍湯、二陳湯參照 PDF 第 136、149 頁（基準方項次 017、187）。保留炙甘草與甘草的名稱差異。
- [八珍湯 · 衛福部基準方](https://dep.mohw.gov.tw/DOcMAP/fp-866-5540-108.html)：十個組成名稱，包含煎服用的生薑、大棗。可透過 SQL 查詢方劑與藥材的組成關係。
- [一貫煎 · 衛福部臺北醫院](https://www.tph.mohw.gov.tw/?aid=86&iid=446&page_name=detail&pid=44)：北沙參、麥門冬、生地黃、當歸、枸杞子、川楝子六個組成名稱。
- [sql.js · SQLite in the browser](https://sql.js.org/documentation/)：透過 WebAssembly 在瀏覽器內執行真正的 SQLite。

## 課堂說明要點

1. 說明五張主表與四張中介表，以及複合主鍵、外來鍵的用途。
2. 用 Q03 解釋 present、absent、未記載，對照 9 與 13 筆結果。
3. 用 Q04 解釋 48 份病例為何形成 54 列證型關聯。
4. 用 Q06 說明 WHERE 篩選資料列、HAVING 篩選群組。
5. 用 Q10 的兩個 0 → 1 儲存格，解釋 COUNT(欄位) 與 COUNT(*)。
