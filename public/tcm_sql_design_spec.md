# 中醫處方實驗室 — 資料庫設計與查詢說明

[開啟網站](https://tab-etuc.github.io/tcm-sql-lab/) · [完整 ERD](./tcm_sql_erd.svg)

本文件由網站使用的欄位字典、固定資料與 SQL 題庫產生，樣本內容和查詢結果與網站共用同一份資料。

## 案例背景

中醫教學診所需要跨病例整理主訴、舌脈、症狀、證型與用方。醫師查找相同證型的病例，研究助理統計各證型與方劑的使用情形，學生透過修改 SQL 理解關聯查詢與結果差異。

病例資料從中國醫門診教學病例 819 筆中，以固定種子 20261117 不重複隨機抽取 100 筆。保留全部來源處方名稱，共 110 種方劑；其中十方的藥材組成依衛福部文件整理。來源證型清單第一項為查詢主證，其餘為次證。

## 資料庫設計

| 資料表 | 中文名稱 | 筆數 |
| --- | --- | --- |
| clinical_case | 病例 | 100 |
| syndrome | 證型 | 34 |
| case_syndrome | 病例 × 證型 | 123 |
| symptom | 症狀 | 908 |
| case_symptom | 病例 × 症狀 | 1459 |
| formula | 方劑 | 110 |
| herb | 藥材 | 49 |
| formula_herb | 方劑 × 藥材 | 86 |
| case_formula | 病例 × 方劑 | 208 |

五張實體／字典表保存病例、證型、症狀、方劑與藥材；四張中介表保存多對多關聯。

```text
clinical_case 1 —— N case_syndrome N —— 1 syndrome
clinical_case 1 —— N case_symptom  N —— 1 symptom
clinical_case 1 —— N case_formula  N —— 1 formula
formula       1 —— N formula_herb N —— 1 herb
```

每筆中介表紀錄的兩個外來鍵都對應一筆主表紀錄，主表可對應 0 到多筆中介表紀錄。複合主鍵使每組配對唯一。主證部分唯一索引限制每例至多一筆主證，種子檢查確認每例恰有一筆。

症狀分成三種紀錄狀態：present 表示陽性、absent 表示明確陰性、缺少關聯列表示未記載。狀態屬於病例與症狀的關聯。

### 抽樣病例示例

| 病例 | 年齡區間 | 主訴 | 證型 | 全部來源處方 |
| --- | --- | --- | --- | --- |
| CASE-001 | 18–29 | 頻尿已1年多 | 肝氣鬱結（主證） | 真武湯、加味逍遙散 |
| CASE-002 | 60+ | 聲音沙啞有少量痰近一個月 | 肺腎陰虛（主證） | 尚無處方 |
| CASE-003 | 未記載 | 經血量多半年,經痛2年 | 氣滯血瘀（主證） | 桂枝茯苓丸 |
| CASE-004 | 未記載 | 胃嘈嘈已一年 | 肝脾不和（主證） | 參苓白朮散、一貫煎 |

### 病例 · clinical_case

一列代表一筆教學門診病例，以 CASE 編號連接證型、症狀與方劑。

| 欄位 | 型別 | 限制 | 說明 |
| --- | --- | --- | --- |
| case_id | TEXT | PK | 教學編號 CASE-001…CASE-100 |
| age_group | TEXT | NOT NULL · CHECK | 0–17、18–29、30–39、40–49、50–59、60+、未記載 |
| diagnosis | TEXT | NOT NULL | 來源病例診斷名稱 |
| chief_complaint | TEXT | NOT NULL | 來源主訴摘要 |
| present_illness | TEXT | NOT NULL | 改寫病程，含明確否認及未記載狀態 |
| tongue | TEXT | NOT NULL | 舌象摘要 |
| pulse | TEXT | NOT NULL | 脈象摘要 |

樣本資料（前 3 筆）：

| case_id | age_group | diagnosis | chief_complaint | present_illness | tongue | pulse |
| --- | --- | --- | --- | --- | --- | --- |
| CASE-001 | 18–29 | 膀胱過動症 | 頻尿已1年多 | 問診記錄：頻尿、失眠、入睡困難、夜尿、緊張、焦慮、飢飽易打嗝、納可、眠差、不易入睡、易緊張焦慮、大便平、小便清長、尿頻(1hr/次)、緊繃與解不乾淨感、色正常、夜尿1次。 | 舌紅稍淡、尖紅、苔薄白、邊少、朱點、有津、津沫 | 右濡軟、左稍濡寸微滑、右脈濡軟 |
| CASE-002 | 60+ | 發聲困難 | 聲音沙啞有少量痰近一個月 | 問診記錄：聲音沙啞、口苦、口乾、夜尿、排便一日一行但是化療完後第3-4天會腹痛腹瀉、口苦口乾咽乾、眠可、食欲可、精神易疲倦、僅發作一日之後又恢復正常、夜尿一次。明確否認失眠。 | 舌色偏紅、舌瘦、苔薄白中根偏黃 | 左右脈弦澀、雙脈弦澀 |
| CASE-003 | 未記載 | 子宮平滑肌瘤 | 經血量多半年,經痛2年 | 問診記錄：腹痛、壓力大、腰痠、腹痛 (部位:下腹 性質:持續悶痛)、平常、工作壓力、腰酸、大便正常、小便正常、經血量多半年,經痛2年。明確否認失眠。 | 舌淡紅、邊有齒痕、苔薄白、略暗 | 沉弱、左關弦、脈沉弱 |

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
| SY-01 | 肝氣鬱結 | 來源病例所載證型；主次角色依來源清單順序建立。 |
| SY-02 | 肺腎陰虛 | 來源病例所載證型；主次角色依來源清單順序建立。 |
| SY-03 | 氣滯血瘀 | 來源病例所載證型；主次角色依來源清單順序建立。 |

### 病例 × 證型 · case_syndrome

複合主鍵避免重複；部分唯一索引限制每筆病例至多一個主證。來源清單第一項設為查詢主證，其餘設為次證；每例恰有一個主證。

| 欄位 | 型別 | 限制 | 說明 |
| --- | --- | --- | --- |
| case_id | TEXT | PK · FK | → clinical_case.case_id |
| syndrome_id | TEXT | PK · FK | → syndrome.syndrome_id |
| syndrome_role | TEXT | NOT NULL · CHECK | primary 主證／secondary 次證 |

樣本資料（前 3 筆）：

| case_id | syndrome_id | syndrome_role |
| --- | --- | --- |
| CASE-001 | SY-01 | primary |
| CASE-002 | SY-02 | primary |
| CASE-003 | SY-03 | primary |

### 症狀 · symptom

同一個症狀名稱只存一次，有無症狀記錄在關聯表。

| 欄位 | 型別 | 限制 | 說明 |
| --- | --- | --- | --- |
| symptom_id | TEXT | PK | 症狀編號 |
| symptom_name | TEXT | UNIQUE · NOT NULL | 症狀名稱 |
| category | TEXT | NOT NULL | 來源結構化問診觀察 |

樣本資料（前 3 筆）：

| symptom_id | symptom_name | category |
| --- | --- | --- |
| SM-01 | 頻尿 | 問診觀察 |
| SM-02 | 失眠 | 問診觀察 |
| SM-03 | 入睡困難 | 問診觀察 |

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
| CASE-001 | SM-01 | present |
| CASE-001 | SM-02 | present |
| CASE-001 | SM-03 | present |

### 方劑 · formula

收錄抽樣病例的所有處方名稱，另附十方組成字典。十方的藥材組成可透過 formula_herb 查詢，其餘方劑保留來源名稱。

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

每例可關聯零到多個來源方劑，複合主鍵保留每組病例與方劑的配對。

| 欄位 | 型別 | 限制 | 說明 |
| --- | --- | --- | --- |
| case_id | TEXT | PK · FK | → clinical_case.case_id |
| formula_id | TEXT | PK · FK | → formula.formula_id |
| formula_role | TEXT | NOT NULL | 來源病例的方劑紀錄 |

樣本資料（前 3 筆）：

| case_id | formula_id | formula_role |
| --- | --- | --- |
| CASE-001 | FM-11 | 來源處方 |
| CASE-001 | FM-12 | 來源處方 |
| CASE-003 | FM-13 | 來源處方 |

## 查詢操作與結果比較

選擇題目後可編輯 SQL、執行查詢、切換預期與實際結果。每題提供修改範例；比較頁同時呈現兩段 SQL、兩側結果、資料列增減及原因。「我的 SQL」使用目前編輯器草稿。「只看差異資料」篩選變更列，完整結果可隨時切回。

| 題目 | SQL 重點 | 原版列數 | 修改列數 |
| --- | --- | --- | --- |
| Q01 找出 50 歲以上的病例 | WHERE、IN | 9 | 15 |
| Q02 主證為氣滯血瘀的病例 | JOIN、WHERE | 37 | 39 |
| Q03 明確記載失眠的病例 | JOIN、AND | 18 | 30 |
| Q04 一份病例，有幾個證型？ | JOIN、一對多 | 123 | 100 |
| Q05 各主證分別有多少病例？ | GROUP BY、COUNT | 29 | 1 |
| Q06 篩出至少 7 例的主證 | HAVING、COUNT | 3 | 5 |
| Q07 拆解逍遙散的藥材組成 | JOIN、ORDER BY | 8 | 12 |
| Q08 找出從未使用的方劑 | LEFT JOIN、IS NULL | 3 | 0 |
| Q09 同時含當歸與炙甘草的方劑 | HAVING、DISTINCT | 3 | 6 |
| Q10 方劑使用次數，包含零次 | LEFT JOIN、COUNT | 110 | 110 |
| Q11 從當歸，追溯到使用病例 | 多表 JOIN、DISTINCT | 4 | 8 |
| Q12 哪些病例尚無處方紀錄？ | NOT EXISTS、NULL | 17 | 0 |

### Q01 · 找出 50 歲以上的病例

研究助理想先檢視 50 歲以上的教學病例。請列出病例編號、年齡區間與診斷名稱。

#### 原版：50 歲以上

```sql
SELECT case_id AS 病例編號,
       age_group AS 年齡區間,
       diagnosis AS 診斷名稱
FROM clinical_case
WHERE age_group IN ('50–59', '60+')
ORDER BY case_id;
```

結果：**9 列**。以下列出前 5 列；完整結果可在網站執行查看。

| 病例編號 | 年齡區間 | 診斷名稱 |
| --- | --- | --- |
| CASE-002 | 60+ | 發聲困難 |
| CASE-014 | 50–59 | 急性咽喉炎 |
| CASE-016 | 50–59 | 停經及女性更年期之病況 |
| CASE-026 | 60+ | 未明示側性卵巢惡性腫瘤 |
| CASE-037 | 60+ | 頸部神經管骨性狹窄、肩部粘連性囊炎、橈骨莖狀突腱鞘炎[deQuervain(氏)] |

#### 修改版：40 歲以上

```sql
SELECT case_id AS 病例編號,
       age_group AS 年齡區間,
       diagnosis AS 診斷名稱
FROM clinical_case
WHERE age_group IN ('40–49', '50–59', '60+')
ORDER BY case_id;
```

結果：**15 列**。以下列出前 5 列；完整結果可在網站執行查看。

| 病例編號 | 年齡區間 | 診斷名稱 |
| --- | --- | --- |
| CASE-002 | 60+ | 發聲困難 |
| CASE-014 | 50–59 | 急性咽喉炎 |
| CASE-016 | 50–59 | 停經及女性更年期之病況 |
| CASE-025 | 40–49 | 左側眼視網膜裂孔 |
| CASE-026 | 60+ | 未明示側性卵巢惡性腫瘤 |

**結果解釋**：把 40–49 加入 IN 清單，納入另外 6 筆病例，結果由 9 變成 15 筆。年齡未記載的病例保留在資料庫，可用 age_group = '未記載' 另行查詢。

**讀懂 SQL**：

1. FROM 指定病例表。
2. WHERE 以年齡區間篩選；文字區間用 IN 明確列舉。
3. ORDER BY 讓病例依編號排列，方便比較。

**學習重點**：年齡區間以文字分類儲存，使用 IN 列舉要納入的區間。

### Q02 · 主證為氣滯血瘀的病例

中醫師希望查閱主證為氣滯血瘀的病例。請透過病例證型關聯，列出病例編號、年齡區間與證型。

#### 原版：只納入主證

```sql
SELECT c.case_id AS 病例編號,
       c.age_group AS 年齡區間,
       s.syndrome_name AS 證型
FROM clinical_case AS c
JOIN case_syndrome AS cs ON c.case_id = cs.case_id
JOIN syndrome AS s ON cs.syndrome_id = s.syndrome_id
WHERE s.syndrome_name = '氣滯血瘀'
  AND cs.syndrome_role = 'primary'
ORDER BY c.case_id;
```

結果：**37 列**。以下列出前 5 列；完整結果可在網站執行查看。

| 病例編號 | 年齡區間 | 證型 |
| --- | --- | --- |
| CASE-003 | 未記載 | 氣滯血瘀 |
| CASE-006 | 未記載 | 氣滯血瘀 |
| CASE-009 | 未記載 | 氣滯血瘀 |
| CASE-010 | 未記載 | 氣滯血瘀 |
| CASE-018 | 未記載 | 氣滯血瘀 |

#### 修改版：主證、次證皆納入

```sql
SELECT c.case_id AS 病例編號,
       c.age_group AS 年齡區間,
       s.syndrome_name AS 證型
FROM clinical_case AS c
JOIN case_syndrome AS cs ON c.case_id = cs.case_id
JOIN syndrome AS s ON cs.syndrome_id = s.syndrome_id
WHERE s.syndrome_name = '氣滯血瘀'
ORDER BY c.case_id;
```

結果：**39 列**。以下列出前 5 列；完整結果可在網站執行查看。

| 病例編號 | 年齡區間 | 證型 |
| --- | --- | --- |
| CASE-003 | 未記載 | 氣滯血瘀 |
| CASE-006 | 未記載 | 氣滯血瘀 |
| CASE-009 | 未記載 | 氣滯血瘀 |
| CASE-010 | 未記載 | 氣滯血瘀 |
| CASE-015 | 未記載 | 氣滯血瘀 |

**結果解釋**：氣滯血瘀作為查詢主證有 37 例；移除 primary 條件後，多出 2 筆以次證記錄的病例。主次角色依來源證型清單順序建立，第一項為查詢主證，其餘為次證。

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

結果：**18 列**。以下列出前 5 列；完整結果可在網站執行查看。

| 病例編號 | 主訴 | 症狀狀態 |
| --- | --- | --- |
| CASE-001 | 頻尿已1年多 | present |
| CASE-005 | 睡眠差嚴重 皮膚癢 腰痠 已數月 | present |
| CASE-007 | 關節疼痛半年左右;眠差約七年。 | present |
| CASE-009 | 經行腹痛,約四年 | present |
| CASE-016 | 更年期症狀如熱潮紅、盜汗、心悸、喘自今年年初開始加重 | present |

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

結果：**30 列**。以下列出前 5 列；完整結果可在網站執行查看。

| 病例編號 | 主訴 | 症狀狀態 |
| --- | --- | --- |
| CASE-001 | 頻尿已1年多 | present |
| CASE-002 | 聲音沙啞有少量痰近一個月 | absent |
| CASE-003 | 經血量多半年,經痛2年 | absent |
| CASE-004 | 胃嘈嘈已一年 | absent |
| CASE-005 | 睡眠差嚴重 皮膚癢 腰痠 已數月 | present |

**結果解釋**：只取 present 得到 18 例，忽略狀態後得到 30 例，新增 12 筆明確陰性紀錄。病例的睡眠正常、眠可與明確否認失眠描述整理為 absent；其餘未記載者保留為缺少關聯列。

**讀懂 SQL**：

1. 找到名稱為失眠的症狀。
2. 透過中介表找出曾記錄此症狀的病例。
3. 再用 present 排除陰性記錄。

**學習重點**：present、absent、未記載是三種不同意思。

### Q04 · 一份病例，有幾個證型？

列出 100 筆抽樣病例及其查詢主證與次證，觀察一份病例如何形成多列證型配對。

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

結果：**123 列**。以下列出前 5 列；完整結果可在網站執行查看。

| 病例編號 | 證型 | 主次證 |
| --- | --- | --- |
| CASE-001 | 肝氣鬱結 | primary |
| CASE-002 | 肺腎陰虛 | primary |
| CASE-003 | 氣滯血瘀 | primary |
| CASE-004 | 肝脾不和 | primary |
| CASE-005 | 腎氣虛 | primary |

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

結果：**100 列**。以下列出前 5 列；完整結果可在網站執行查看。

| 病例編號 | 證型 | 主次證 |
| --- | --- | --- |
| CASE-001 | 肝氣鬱結 | primary |
| CASE-002 | 肺腎陰虛 | primary |
| CASE-003 | 氣滯血瘀 | primary |
| CASE-004 | 肝脾不和 | primary |
| CASE-005 | 腎氣虛 | primary |

**結果解釋**：100 筆病例各有一個查詢主證，另有 23 個次證關聯。JOIN 輸出 123 列配對；限制 primary 後剩下 100 列。

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

結果：**29 列**。以下列出前 5 列；完整結果可在網站執行查看。

| 證型 | 病例數 |
| --- | --- |
| 氣滯血瘀 | 37 |
| 肝腎陰虛 | 16 |
| 脾胃氣虛 | 10 |
| 脾腎陽虛 | 4 |
| 肝陽上亢 | 3 |

#### 修改版：全部主證合計

```sql
SELECT COUNT(*) AS 總病例數
FROM case_syndrome
WHERE syndrome_role = 'primary';
```

結果：**1 列**。

| 總病例數 |
| --- |
| 100 |

**結果解釋**：GROUP BY 將 100 筆查詢主證分成 29 個有病例的組別。不分組時只有一列總計 100。證型字典共有 34 種，其中也包含只作為次證的詞條。

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
| 氣滯血瘀 | 37 |
| 肝腎陰虛 | 16 |
| 脾胃氣虛 | 10 |

#### 修改版：至少 3 例

```sql
SELECT s.syndrome_name AS 證型,
       COUNT(*) AS 病例數
FROM syndrome AS s
JOIN case_syndrome AS cs ON s.syndrome_id = cs.syndrome_id
WHERE cs.syndrome_role = 'primary'
GROUP BY s.syndrome_id, s.syndrome_name
HAVING COUNT(*) >= 3
ORDER BY 病例數 DESC, s.syndrome_id;
```

結果：**5 列**。

| 證型 | 病例數 |
| --- | --- |
| 氣滯血瘀 | 37 |
| 肝腎陰虛 | 16 |
| 脾胃氣虛 | 10 |
| 脾腎陽虛 | 4 |
| 肝陽上亢 | 3 |

**結果解釋**：門檻從 7 降到 3，組別由 3 增至 5。目前主證前幾名是 氣滯血瘀 37 例、肝腎陰虛 16 例、脾胃氣虛 10 例、脾腎陽虛 4 例、肝陽上亢 3 例。WHERE 先篩資料列，HAVING 再篩聚合後的組別。

**讀懂 SQL**：

1. WHERE 先限制 primary。
2. GROUP BY 形成每一個證型的組別。
3. HAVING 在 COUNT 完成後篩選組別。

**學習重點**：WHERE 篩列；HAVING 篩組。

### Q07 · 拆解逍遙散的藥材組成

查出逍遙散有哪些組成藥材，依照來源記錄的組成順序顯示。 方劑藥材字典提供十方的組成紀錄。

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

結果：**3 列**。

| 方劑編號 | 方劑名稱 |
| --- | --- |
| FM-01 | 逍遙散 |
| FM-02 | 八珍湯 |
| FM-08 | 荊防敗毒散 |

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

**結果解釋**：目前有 3 個字典方劑尚無抽樣病例關聯：逍遙散、八珍湯、荊防敗毒散。LEFT JOIN 保留它們並以 NULL 標示右表；改成 INNER JOIN 後先排除未配對資料，結果為 0 筆。

**讀懂 SQL**：

1. 從完整方劑字典出發。
2. LEFT JOIN 保留未配對的左表資料。
3. 用右表主鍵 IS NULL 識別無關聯者。

**學習重點**：查詢零筆關聯時，先用 LEFT JOIN 保留左表資料，再以 IS NULL 篩選。

### Q09 · 同時含當歸與炙甘草的方劑

找出同時具有當歸和炙甘草的方劑，注意這兩種藥材會出現在不同的組成列。 方劑藥材字典提供十方的組成紀錄。

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

**結果解釋**：只查詢已有藥材組成紀錄的方劑。WHERE IN 保留當歸與炙甘草，HAVING COUNT(DISTINCT) = 2 得到逍遙散、八珍湯、歸脾湯；改成 >= 1 再納入小柴胡湯、二陳湯、一貫煎。

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

結果：**110 列**。以下列出前 5 列；完整結果可在網站執行查看。

| 方劑名稱 | 使用次數 |
| --- | --- |
| 加味逍遙散 | 8 |
| 知柏地黃丸 | 7 |
| 芍藥甘草湯 | 7 |
| 生脈飲 | 5 |
| 麻子仁丸 | 5 |

#### 修改版：COUNT(*)

```sql
SELECT f.formula_name AS 方劑名稱,
       COUNT(*) AS 使用次數
FROM formula AS f
LEFT JOIN case_formula AS cf ON f.formula_id = cf.formula_id
GROUP BY f.formula_id, f.formula_name
ORDER BY 使用次數 DESC, f.formula_id;
```

結果：**110 列**。以下列出前 5 列；完整結果可在網站執行查看。

| 方劑名稱 | 使用次數 |
| --- | --- |
| 加味逍遙散 | 8 |
| 知柏地黃丸 | 7 |
| 芍藥甘草湯 | 7 |
| 生脈飲 | 5 |
| 麻子仁丸 | 5 |

**結果解釋**：兩次結果都有 110 列。3 個未使用方劑的計數由 0 變成 1：COUNT(欄位) 忽略 NULL，COUNT(*) 計入 LEFT JOIN 保留的空配對列。一例可用多方，每個病例與方劑配對各計一次。

**讀懂 SQL**：

1. LEFT JOIN 讓110 個方劑都保留。
2. 以方劑分組。
3. COUNT(cf.case_id) 計算右表有值的病例編號。

**學習重點**：比較結果時，同時查看列數與各儲存格的內容。

### Q11 · 從當歸，追溯到使用病例

沿著病例、方劑、組成與藥材的關聯，找出使用過含當歸方劑的病例。 方劑藥材字典提供十方的組成紀錄。

#### 原版：方劑含當歸

```sql
SELECT DISTINCT c.case_id AS 病例編號,
       c.age_group AS 年齡區間,
       c.diagnosis AS 診斷名稱
FROM clinical_case AS c
JOIN case_formula AS cf ON c.case_id = cf.case_id
JOIN formula_herb AS fh ON cf.formula_id = fh.formula_id
JOIN herb AS h ON fh.herb_id = h.herb_id
WHERE h.herb_name = '當歸'
ORDER BY c.case_id;
```

結果：**4 列**。

| 病例編號 | 年齡區間 | 診斷名稱 |
| --- | --- | --- |
| CASE-004 | 未記載 | 功能性消化不良 |
| CASE-024 | 未記載 | 夜尿 |
| CASE-064 | 60+ | 尿滯留 |
| CASE-076 | 未記載 | 肌少症 |

#### 修改版：方劑含炙甘草

```sql
SELECT DISTINCT c.case_id AS 病例編號,
       c.age_group AS 年齡區間,
       c.diagnosis AS 診斷名稱
FROM clinical_case AS c
JOIN case_formula AS cf ON c.case_id = cf.case_id
JOIN formula_herb AS fh ON cf.formula_id = fh.formula_id
JOIN herb AS h ON fh.herb_id = h.herb_id
WHERE h.herb_name = '炙甘草'
ORDER BY c.case_id;
```

結果：**8 列**。以下列出前 5 列；完整結果可在網站執行查看。

| 病例編號 | 年齡區間 | 診斷名稱 |
| --- | --- | --- |
| CASE-024 | 未記載 | 夜尿 |
| CASE-045 | 未記載 | 毛囊疾患 |
| CASE-050 | 未記載 | 兒童期生理發育不符正常預期 |
| CASE-051 | 未記載 | 胃食道逆流性疾病、過敏性鼻炎 |
| CASE-054 | 40–49 | 結腸惡性腫瘤 |

**結果解釋**：依已收錄的十方藥材組成，含當歸方劑追溯到 4 份病例；改查炙甘草得到 8 份。DISTINCT 將同一病例使用多個符合方劑所產生的配對列合併。

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

結果：**17 列**。以下列出前 5 列；完整結果可在網站執行查看。

| 病例編號 | 主訴 |
| --- | --- |
| CASE-002 | 聲音沙啞有少量痰近一個月 |
| CASE-016 | 更年期症狀如熱潮紅、盜汗、心悸、喘自今年年初開始加重 |
| CASE-018 | 運動後急性腰痛已三天。 |
| CASE-027 | 雙小腿疼痛數月。 |
| CASE-028 | 左手腕疼痛數月 |

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

**結果解釋**：抽樣病例中有 17 例的來源方劑清單為空。NOT EXISTS 保留這些病例；INNER JOIN 先排除空關聯，之後 IS NULL 得到 0 例。

**讀懂 SQL**：

1. 逐一檢視病例。
2. 子查詢以相同 case_id 檢查用方紀錄。
3. 來源方劑清單為空時，NOT EXISTS 保留這份病例。

**學習重點**：NOT EXISTS 與 LEFT JOIN / IS NULL 都能表達反連結。

## 執行方式

GitHub Pages 提供靜態網站。sql.js 將 SQLite 編譯成 WebAssembly，在瀏覽器 Web Worker 執行查詢。每次查詢重新載入固定種子；基準答案亦由 SQLite 實際執行取得。

實驗室接受唯讀查詢，每次最多 2,000 列與八組結果，畫面顯示最後一組。查詢可手動停止，超過八秒會自動停止。語法、欄位或資料表錯誤會顯示原生 SQLite 訊息及中文提示。CSV 下載對應目前選取的預期／實際結果分頁；SQLite 與建表 SQL 可從網站下載。

結果比較保留重複列次數；欄位結構不同時先提示對齊欄位。資料相同而排序不同時會標示排序差異。每題草稿與完成進度保存在目前瀏覽器。

## 資料來源

- 中國醫門診教學病例：以固定種子 20261117，從 819 筆病例不重複隨機抽取 100 筆，保留證型、症狀與來源處方。來源證型清單第一項作為查詢主證，其餘為次證。
- [中藥常用方劑語意解析及英譯彙編](https://www.mohw.gov.tw/dl-69997-92bcd2d5-5987-48d1-a15e-ffb2185fb1e7.html)：方劑分類、出處與藥材組成。逍遙散參照 PDF 第 68–69 頁；歸脾湯第 96 頁。
- [臺灣中藥典第四版](https://www.mohw.gov.tw/dl-71936-0a89f40d-7558-4ab2-8f4b-55e58de6552b.html)：八珍湯、二陳湯參照 PDF 第 136、149 頁（基準方項次 017、187）。保留炙甘草與甘草的名稱差異。
- [八珍湯 · 衛福部基準方](https://dep.mohw.gov.tw/DOcMAP/fp-866-5540-108.html)：十個組成名稱，包含煎服用的生薑、大棗。可透過 SQL 查詢方劑與藥材的組成關係。
- [一貫煎 · 衛福部臺北醫院](https://www.tph.mohw.gov.tw/?aid=86&iid=446&page_name=detail&pid=44)：北沙參、麥門冬、生地黃、當歸、枸杞子、川楝子六個組成名稱。
- [sql.js · SQLite in the browser](https://sql.js.org/documentation/)：透過 WebAssembly 在瀏覽器內執行真正的 SQLite。

## 課堂說明要點

1. 說明五張主表與四張中介表，以及複合主鍵、外來鍵的用途。
2. 用 Q03 解釋 present、absent、未記載，對照 18 與 30 筆結果。
3. 用 Q04 解釋 100 份病例為何形成 123 列證型關聯。
4. 用 Q06 說明 WHERE 篩選資料列、HAVING 篩選群組。
5. 用 Q10 的三個 0 → 1 儲存格，解釋 COUNT(欄位) 與 COUNT(*)。
