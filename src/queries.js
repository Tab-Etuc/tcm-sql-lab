// Expected counts are verified against the fixed 100-case SQLite sample during build.
export const questions = [
  {
    "id": "Q01",
    "title": "找出 50 歲以上的病例",
    "group": "條件篩選",
    "level": "入門",
    "tags": [
      "WHERE",
      "IN"
    ],
    "tables": [
      "clinical_case"
    ],
    "prompt": "研究助理想先檢視 50 歲以上的教學病例。請列出病例編號、年齡區間與診斷名稱。",
    "sql": "SELECT case_id AS 病例編號,\n       age_group AS 年齡區間,\n       diagnosis AS 診斷名稱\nFROM clinical_case\nWHERE age_group IN ('50–59', '60+')\nORDER BY case_id;",
    "variant": "SELECT case_id AS 病例編號,\n       age_group AS 年齡區間,\n       diagnosis AS 診斷名稱\nFROM clinical_case\nWHERE age_group IN ('40–49', '50–59', '60+')\nORDER BY case_id;",
    "expected": 9,
    "modified": 15,
    "before": "50 歲以上",
    "after": "40 歲以上",
    "why": "把 40–49 加入 IN 清單，納入另外 6 筆病例，結果由 9 變成 15 筆。年齡未記載的病例保留在資料庫，可用 age_group = '未記載' 另行查詢。",
    "steps": [
      "FROM 指定病例表。",
      "WHERE 以年齡區間篩選；文字區間用 IN 明確列舉。",
      "ORDER BY 讓病例依編號排列，方便比較。"
    ],
    "takeaway": "年齡區間以文字分類儲存，使用 IN 列舉要納入的區間。"
  },
  {
    "id": "Q02",
    "title": "主證為氣滯血瘀的病例",
    "group": "條件篩選",
    "level": "入門",
    "tags": [
      "JOIN",
      "WHERE"
    ],
    "tables": [
      "clinical_case",
      "case_syndrome",
      "syndrome"
    ],
    "prompt": "中醫師希望查閱主證為氣滯血瘀的病例。請透過病例證型關聯，列出病例編號、年齡區間與證型。",
    "sql": "SELECT c.case_id AS 病例編號,\n       c.age_group AS 年齡區間,\n       s.syndrome_name AS 證型\nFROM clinical_case AS c\nJOIN case_syndrome AS cs ON c.case_id = cs.case_id\nJOIN syndrome AS s ON cs.syndrome_id = s.syndrome_id\nWHERE s.syndrome_name = '氣滯血瘀'\n  AND cs.syndrome_role = 'primary'\nORDER BY c.case_id;",
    "variant": "SELECT c.case_id AS 病例編號,\n       c.age_group AS 年齡區間,\n       s.syndrome_name AS 證型\nFROM clinical_case AS c\nJOIN case_syndrome AS cs ON c.case_id = cs.case_id\nJOIN syndrome AS s ON cs.syndrome_id = s.syndrome_id\nWHERE s.syndrome_name = '氣滯血瘀'\nORDER BY c.case_id;",
    "expected": 37,
    "modified": 39,
    "before": "只納入主證",
    "after": "主證、次證皆納入",
    "why": "氣滯血瘀作為查詢主證有 37 例；移除 primary 條件後，多出 2 筆以次證記錄的病例。主次角色依來源證型清單順序建立，第一項為查詢主證，其餘為次證。",
    "steps": [
      "JOIN 將病例連到中介表，再連到證型字典。",
      "用 syndrome_name 指定證型。",
      "syndrome_role 限制這個證型在病例中必須是主證。"
    ],
    "takeaway": "同一個證型，在不同病例裡可能扮演不同角色。"
  },
  {
    "id": "Q03",
    "title": "明確記載失眠的病例",
    "group": "條件篩選",
    "level": "入門",
    "tags": [
      "JOIN",
      "AND"
    ],
    "tables": [
      "clinical_case",
      "case_symptom",
      "symptom"
    ],
    "prompt": "研究助理需要有「失眠」陽性症狀的病例。請排除明確否認失眠的紀錄，並顯示症狀狀態。",
    "sql": "SELECT c.case_id AS 病例編號,\n       c.chief_complaint AS 主訴,\n       cs.status AS 症狀狀態\nFROM clinical_case AS c\nJOIN case_symptom AS cs ON c.case_id = cs.case_id\nJOIN symptom AS s ON cs.symptom_id = s.symptom_id\nWHERE s.symptom_name = '失眠'\n  AND cs.status = 'present'\nORDER BY c.case_id;",
    "variant": "SELECT c.case_id AS 病例編號,\n       c.chief_complaint AS 主訴,\n       cs.status AS 症狀狀態\nFROM clinical_case AS c\nJOIN case_symptom AS cs ON c.case_id = cs.case_id\nJOIN symptom AS s ON cs.symptom_id = s.symptom_id\nWHERE s.symptom_name = '失眠'\nORDER BY c.case_id;",
    "expected": 18,
    "modified": 30,
    "before": "有失眠（present）",
    "after": "忽略症狀狀態",
    "why": "只取 present 得到 18 例，忽略狀態後得到 30 例，新增 12 筆明確陰性紀錄。病例的睡眠正常、眠可與明確否認失眠描述整理為 absent；其餘未記載者保留為缺少關聯列。",
    "steps": [
      "找到名稱為失眠的症狀。",
      "透過中介表找出曾記錄此症狀的病例。",
      "再用 present 排除陰性記錄。"
    ],
    "takeaway": "present、absent、未記載是三種不同意思。"
  },
  {
    "id": "Q04",
    "title": "一份病例，有幾個證型？",
    "group": "資料連結",
    "level": "基礎",
    "tags": [
      "JOIN",
      "一對多"
    ],
    "tables": [
      "clinical_case",
      "case_syndrome",
      "syndrome"
    ],
    "prompt": "列出 100 筆抽樣病例及其查詢主證與次證，觀察一份病例如何形成多列證型配對。",
    "sql": "SELECT c.case_id AS 病例編號,\n       s.syndrome_name AS 證型,\n       cs.syndrome_role AS 主次證\nFROM clinical_case AS c\nJOIN case_syndrome AS cs ON c.case_id = cs.case_id\nJOIN syndrome AS s ON cs.syndrome_id = s.syndrome_id\nORDER BY c.case_id, cs.syndrome_role;",
    "variant": "SELECT c.case_id AS 病例編號,\n       s.syndrome_name AS 證型,\n       cs.syndrome_role AS 主次證\nFROM clinical_case AS c\nJOIN case_syndrome AS cs ON c.case_id = cs.case_id\nJOIN syndrome AS s ON cs.syndrome_id = s.syndrome_id\nWHERE cs.syndrome_role = 'primary'\nORDER BY c.case_id, cs.syndrome_role;",
    "expected": 123,
    "modified": 100,
    "before": "所有證型關聯",
    "after": "僅主證關聯",
    "why": "100 筆病例各有一個查詢主證，另有 23 個次證關聯。JOIN 輸出 123 列配對；限制 primary 後剩下 100 列。",
    "steps": [
      "由病例走到 case_syndrome。",
      "一個病例有兩個證型就輸出兩列。",
      "保留 syndrome_role，清楚解釋每一列的角色。"
    ],
    "takeaway": "COUNT(*) 計算關聯列數，COUNT(DISTINCT case_id) 計算病例數。"
  },
  {
    "id": "Q05",
    "title": "各主證分別有多少病例？",
    "group": "分組統計",
    "level": "基礎",
    "tags": [
      "GROUP BY",
      "COUNT"
    ],
    "tables": [
      "syndrome",
      "case_syndrome"
    ],
    "prompt": "研究助理要統計各主證的病例數，並由多到少排列。只計 primary，避免次證重複計入。",
    "sql": "SELECT s.syndrome_name AS 證型,\n       COUNT(*) AS 病例數\nFROM syndrome AS s\nJOIN case_syndrome AS cs ON s.syndrome_id = cs.syndrome_id\nWHERE cs.syndrome_role = 'primary'\nGROUP BY s.syndrome_id, s.syndrome_name\nORDER BY 病例數 DESC, s.syndrome_id;",
    "variant": "SELECT COUNT(*) AS 總病例數\nFROM case_syndrome\nWHERE syndrome_role = 'primary';",
    "expected": 29,
    "modified": 1,
    "before": "每個證型分組",
    "after": "全部主證合計",
    "why": "GROUP BY 將 100 筆查詢主證分成 29 個有病例的組別。不分組時只有一列總計 100。證型字典共有 34 種，其中也包含只作為次證的詞條。",
    "steps": [
      "先用 WHERE 留下主證。",
      "GROUP BY 用證型編號與名稱分組。",
      "COUNT(*) 統計每一組的關聯列數。"
    ],
    "takeaway": "拿掉 GROUP BY 時，也要重新考慮 SELECT 的顯示欄位。"
  },
  {
    "id": "Q06",
    "title": "篩出至少 7 例的主證",
    "group": "分組統計",
    "level": "基礎",
    "tags": [
      "HAVING",
      "COUNT"
    ],
    "tables": [
      "syndrome",
      "case_syndrome"
    ],
    "prompt": "只顯示病例數至少 7 筆的主證。分組後的條件應放在 HAVING。",
    "sql": "SELECT s.syndrome_name AS 證型,\n       COUNT(*) AS 病例數\nFROM syndrome AS s\nJOIN case_syndrome AS cs ON s.syndrome_id = cs.syndrome_id\nWHERE cs.syndrome_role = 'primary'\nGROUP BY s.syndrome_id, s.syndrome_name\nHAVING COUNT(*) >= 7\nORDER BY 病例數 DESC, s.syndrome_id;",
    "variant": "SELECT s.syndrome_name AS 證型,\n       COUNT(*) AS 病例數\nFROM syndrome AS s\nJOIN case_syndrome AS cs ON s.syndrome_id = cs.syndrome_id\nWHERE cs.syndrome_role = 'primary'\nGROUP BY s.syndrome_id, s.syndrome_name\nHAVING COUNT(*) >= 3\nORDER BY 病例數 DESC, s.syndrome_id;",
    "expected": 3,
    "modified": 5,
    "before": "至少 7 例",
    "after": "至少 3 例",
    "why": "門檻從 7 降到 3，組別由 3 增至 5。目前主證前幾名是 氣滯血瘀 37 例、肝腎陰虛 16 例、脾胃氣虛 10 例、脾腎陽虛 4 例、肝陽上亢 3 例。WHERE 先篩資料列，HAVING 再篩聚合後的組別。",
    "steps": [
      "WHERE 先限制 primary。",
      "GROUP BY 形成每一個證型的組別。",
      "HAVING 在 COUNT 完成後篩選組別。"
    ],
    "takeaway": "WHERE 篩列；HAVING 篩組。"
  },
  {
    "id": "Q07",
    "title": "拆解逍遙散的藥材組成",
    "group": "資料連結",
    "level": "基礎",
    "tags": [
      "JOIN",
      "ORDER BY"
    ],
    "tables": [
      "formula",
      "formula_herb",
      "herb"
    ],
    "prompt": "查出逍遙散有哪些組成藥材，依照來源記錄的組成順序顯示。 方劑藥材字典提供十方的組成紀錄。",
    "sql": "SELECT h.herb_name AS 藥材名稱,\n       fh.ingredient_order AS 組成順序\nFROM formula AS f\nJOIN formula_herb AS fh ON f.formula_id = fh.formula_id\nJOIN herb AS h ON fh.herb_id = h.herb_id\nWHERE f.formula_name = '逍遙散'\nORDER BY fh.ingredient_order;",
    "variant": "SELECT h.herb_name AS 藥材名稱,\n       fh.ingredient_order AS 組成順序\nFROM formula AS f\nJOIN formula_herb AS fh ON f.formula_id = fh.formula_id\nJOIN herb AS h ON fh.herb_id = h.herb_id\nWHERE f.formula_name = '歸脾湯'\nORDER BY fh.ingredient_order;",
    "expected": 8,
    "modified": 12,
    "before": "逍遙散",
    "after": "歸脾湯",
    "why": "兩次使用完全相同的三表 JOIN，只更換方劑名稱。來源字典記錄逍遙散 8 個組成、歸脾湯 12 個組成；包含薑棗等來源列出的組成。比較以「藥材名稱＋組成順序」為一列，同名藥材的順序改變時，也會呈現一列移除與一列新增。",
    "steps": [
      "formula 找到方劑。",
      "formula_herb 取得其藥材編號與順序。",
      "herb 將編號換成可讀的藥材名稱。"
    ],
    "takeaway": "同一個 JOIN 路徑可以回答不同方劑的組成問題。"
  },
  {
    "id": "Q08",
    "title": "找出從未使用的方劑",
    "group": "資料連結",
    "level": "基礎",
    "tags": [
      "LEFT JOIN",
      "IS NULL"
    ],
    "tables": [
      "formula",
      "case_formula"
    ],
    "prompt": "保留所有方劑，找出沒有任何病例用方紀錄的方劑。",
    "sql": "SELECT f.formula_id AS 方劑編號,\n       f.formula_name AS 方劑名稱\nFROM formula AS f\nLEFT JOIN case_formula AS cf ON f.formula_id = cf.formula_id\nWHERE cf.case_id IS NULL\nORDER BY f.formula_id;",
    "variant": "SELECT f.formula_id AS 方劑編號,\n       f.formula_name AS 方劑名稱\nFROM formula AS f\nINNER JOIN case_formula AS cf ON f.formula_id = cf.formula_id\nWHERE cf.case_id IS NULL\nORDER BY f.formula_id;",
    "expected": 3,
    "modified": 0,
    "before": "LEFT JOIN",
    "after": "INNER JOIN",
    "why": "目前有 3 個字典方劑尚無抽樣病例關聯：逍遙散、八珍湯、荊防敗毒散。LEFT JOIN 保留它們並以 NULL 標示右表；改成 INNER JOIN 後先排除未配對資料，結果為 0 筆。",
    "steps": [
      "從完整方劑字典出發。",
      "LEFT JOIN 保留未配對的左表資料。",
      "用右表主鍵 IS NULL 識別無關聯者。"
    ],
    "takeaway": "查詢零筆關聯時，先用 LEFT JOIN 保留左表資料，再以 IS NULL 篩選。"
  },
  {
    "id": "Q09",
    "title": "同時含當歸與炙甘草的方劑",
    "group": "進階練習",
    "level": "進階",
    "tags": [
      "HAVING",
      "DISTINCT"
    ],
    "tables": [
      "formula",
      "formula_herb",
      "herb"
    ],
    "prompt": "找出同時具有當歸和炙甘草的方劑，注意這兩種藥材會出現在不同的組成列。 方劑藥材字典提供十方的組成紀錄。",
    "sql": "SELECT f.formula_name AS 方劑名稱\nFROM formula AS f\nJOIN formula_herb AS fh ON f.formula_id = fh.formula_id\nJOIN herb AS h ON fh.herb_id = h.herb_id\nWHERE h.herb_name IN ('當歸', '炙甘草')\nGROUP BY f.formula_id, f.formula_name\nHAVING COUNT(DISTINCT h.herb_id) = 2\nORDER BY f.formula_id;",
    "variant": "SELECT f.formula_name AS 方劑名稱\nFROM formula AS f\nJOIN formula_herb AS fh ON f.formula_id = fh.formula_id\nJOIN herb AS h ON fh.herb_id = h.herb_id\nWHERE h.herb_name IN ('當歸', '炙甘草')\nGROUP BY f.formula_id, f.formula_name\nHAVING COUNT(DISTINCT h.herb_id) >= 1\nORDER BY f.formula_id;",
    "expected": 3,
    "modified": 6,
    "before": "兩種都包含",
    "after": "至少包含一種",
    "why": "只查詢已有藥材組成紀錄的方劑。WHERE IN 保留當歸與炙甘草，HAVING COUNT(DISTINCT) = 2 得到逍遙散、八珍湯、歸脾湯；改成 >= 1 再納入小柴胡湯、二陳湯、一貫煎。",
    "steps": [
      "IN 在每列保留當歸或炙甘草。",
      "按方劑分組，把不同組成列放回同一組。",
      "COUNT(DISTINCT) = 2 檢查兩種藥材是否齊全。"
    ],
    "takeaway": "一列的藥材名稱不可能同時等於兩個名稱；「皆包含」需跨列聚合。"
  },
  {
    "id": "Q10",
    "title": "方劑使用次數，包含零次",
    "group": "分組統計",
    "level": "基礎",
    "tags": [
      "LEFT JOIN",
      "COUNT"
    ],
    "tables": [
      "formula",
      "case_formula"
    ],
    "prompt": "統計每種方劑被幾份病例使用。未使用的方劑也必須顯示 0。",
    "sql": "SELECT f.formula_name AS 方劑名稱,\n       COUNT(cf.case_id) AS 使用次數\nFROM formula AS f\nLEFT JOIN case_formula AS cf ON f.formula_id = cf.formula_id\nGROUP BY f.formula_id, f.formula_name\nORDER BY 使用次數 DESC, f.formula_id;",
    "variant": "SELECT f.formula_name AS 方劑名稱,\n       COUNT(*) AS 使用次數\nFROM formula AS f\nLEFT JOIN case_formula AS cf ON f.formula_id = cf.formula_id\nGROUP BY f.formula_id, f.formula_name\nORDER BY 使用次數 DESC, f.formula_id;",
    "expected": 110,
    "modified": 110,
    "before": "COUNT(cf.case_id)",
    "after": "COUNT(*)",
    "why": "兩次結果都有 110 列。3 個未使用方劑的計數由 0 變成 1：COUNT(欄位) 忽略 NULL，COUNT(*) 計入 LEFT JOIN 保留的空配對列。一例可用多方，每個病例與方劑配對各計一次。",
    "steps": [
      "LEFT JOIN 讓110 個方劑都保留。",
      "以方劑分組。",
      "COUNT(cf.case_id) 計算右表有值的病例編號。"
    ],
    "takeaway": "比較結果時，同時查看列數與各儲存格的內容。"
  },
  {
    "id": "Q11",
    "title": "從當歸，追溯到使用病例",
    "group": "進階練習",
    "level": "進階",
    "tags": [
      "多表 JOIN",
      "DISTINCT"
    ],
    "tables": [
      "clinical_case",
      "case_formula",
      "formula_herb",
      "herb"
    ],
    "prompt": "沿著病例、方劑、組成與藥材的關聯，找出使用過含當歸方劑的病例。 方劑藥材字典提供十方的組成紀錄。",
    "sql": "SELECT DISTINCT c.case_id AS 病例編號,\n       c.age_group AS 年齡區間,\n       c.diagnosis AS 診斷名稱\nFROM clinical_case AS c\nJOIN case_formula AS cf ON c.case_id = cf.case_id\nJOIN formula_herb AS fh ON cf.formula_id = fh.formula_id\nJOIN herb AS h ON fh.herb_id = h.herb_id\nWHERE h.herb_name = '當歸'\nORDER BY c.case_id;",
    "variant": "SELECT DISTINCT c.case_id AS 病例編號,\n       c.age_group AS 年齡區間,\n       c.diagnosis AS 診斷名稱\nFROM clinical_case AS c\nJOIN case_formula AS cf ON c.case_id = cf.case_id\nJOIN formula_herb AS fh ON cf.formula_id = fh.formula_id\nJOIN herb AS h ON fh.herb_id = h.herb_id\nWHERE h.herb_name = '炙甘草'\nORDER BY c.case_id;",
    "expected": 4,
    "modified": 8,
    "before": "方劑含當歸",
    "after": "方劑含炙甘草",
    "why": "依已收錄的十方藥材組成，含當歸方劑追溯到 4 份病例；改查炙甘草得到 8 份。DISTINCT 將同一病例使用多個符合方劑所產生的配對列合併。",
    "steps": [
      "case_formula 把病例連到使用方劑。",
      "formula_herb 把方劑展開成組成。",
      "用藥材名稱篩選，DISTINCT 避免未來多方資料重複列出同一病例。"
    ],
    "takeaway": "多表 JOIN 可以從最末端的藥材條件追溯到最上游的病例。"
  },
  {
    "id": "Q12",
    "title": "哪些病例尚無處方紀錄？",
    "group": "進階練習",
    "level": "進階",
    "tags": [
      "NOT EXISTS",
      "NULL"
    ],
    "tables": [
      "clinical_case",
      "case_formula"
    ],
    "prompt": "列出沒有任何用方紀錄的病例，用 NOT EXISTS 表達「不存在符合的關聯」。",
    "sql": "SELECT c.case_id AS 病例編號,\n       c.chief_complaint AS 主訴\nFROM clinical_case AS c\nWHERE NOT EXISTS (\n  SELECT 1 FROM case_formula AS cf\n  WHERE cf.case_id = c.case_id\n)\nORDER BY c.case_id;",
    "variant": "SELECT c.case_id AS 病例編號,\n       c.chief_complaint AS 主訴\nFROM clinical_case AS c\nINNER JOIN case_formula AS cf ON c.case_id = cf.case_id\nWHERE cf.case_id IS NULL\nORDER BY c.case_id;",
    "expected": 17,
    "modified": 0,
    "before": "NOT EXISTS",
    "after": "INNER JOIN 再找 NULL",
    "why": "抽樣病例中有 17 例的來源方劑清單為空。NOT EXISTS 保留這些病例；INNER JOIN 先排除空關聯，之後 IS NULL 得到 0 例。",
    "steps": [
      "逐一檢視病例。",
      "子查詢以相同 case_id 檢查用方紀錄。",
      "來源方劑清單為空時，NOT EXISTS 保留這份病例。"
    ],
    "takeaway": "NOT EXISTS 與 LEFT JOIN / IS NULL 都能表達反連結。"
  }
];
