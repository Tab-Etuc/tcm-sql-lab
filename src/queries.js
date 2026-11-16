const age = `SELECT case_id AS 病例編號,
       age_group AS 年齡區間,
       tcm_disease AS 中醫病名
FROM clinical_case
WHERE age_group IN ('50–59', '60+')
ORDER BY case_id;`;
const primary = `SELECT c.case_id AS 病例編號,
       c.age_group AS 年齡區間,
       s.syndrome_name AS 證型
FROM clinical_case AS c
JOIN case_syndrome AS cs ON c.case_id = cs.case_id
JOIN syndrome AS s ON cs.syndrome_id = s.syndrome_id
WHERE s.syndrome_name = '肝鬱脾虛'
  AND cs.syndrome_role = 'primary'
ORDER BY c.case_id;`;
const insomnia = `SELECT c.case_id AS 病例編號,
       c.chief_complaint AS 主訴,
       cs.status AS 症狀狀態
FROM clinical_case AS c
JOIN case_symptom AS cs ON c.case_id = cs.case_id
JOIN symptom AS s ON cs.symptom_id = s.symptom_id
WHERE s.symptom_name = '失眠'
  AND cs.status = 'present'
ORDER BY c.case_id;`;
const allSyndromes = `SELECT c.case_id AS 病例編號,
       s.syndrome_name AS 證型,
       cs.syndrome_role AS 主次證
FROM clinical_case AS c
JOIN case_syndrome AS cs ON c.case_id = cs.case_id
JOIN syndrome AS s ON cs.syndrome_id = s.syndrome_id
ORDER BY c.case_id, cs.syndrome_role;`;
const grouping = `SELECT s.syndrome_name AS 證型,
       COUNT(*) AS 病例數
FROM syndrome AS s
JOIN case_syndrome AS cs ON s.syndrome_id = cs.syndrome_id
WHERE cs.syndrome_role = 'primary'
GROUP BY s.syndrome_id, s.syndrome_name
ORDER BY 病例數 DESC, s.syndrome_id;`;
const having = grouping.replace('ORDER BY', 'HAVING COUNT(*) >= 7\nORDER BY');
const ingredients = `SELECT h.herb_name AS 藥材名稱,
       fh.ingredient_order AS 組成順序
FROM formula AS f
JOIN formula_herb AS fh ON f.formula_id = fh.formula_id
JOIN herb AS h ON fh.herb_id = h.herb_id
WHERE f.formula_name = '逍遙散'
ORDER BY fh.ingredient_order;`;
const unused = `SELECT f.formula_id AS 方劑編號,
       f.formula_name AS 方劑名稱
FROM formula AS f
LEFT JOIN case_formula AS cf ON f.formula_id = cf.formula_id
WHERE cf.case_id IS NULL
ORDER BY f.formula_id;`;
const both = `SELECT f.formula_name AS 方劑名稱
FROM formula AS f
JOIN formula_herb AS fh ON f.formula_id = fh.formula_id
JOIN herb AS h ON fh.herb_id = h.herb_id
WHERE h.herb_name IN ('當歸', '炙甘草')
GROUP BY f.formula_id, f.formula_name
HAVING COUNT(DISTINCT h.herb_id) = 2
ORDER BY f.formula_id;`;
const usage = `SELECT f.formula_name AS 方劑名稱,
       COUNT(cf.case_id) AS 使用次數
FROM formula AS f
LEFT JOIN case_formula AS cf ON f.formula_id = cf.formula_id
GROUP BY f.formula_id, f.formula_name
ORDER BY 使用次數 DESC, f.formula_id;`;
const herbCases = `SELECT DISTINCT c.case_id AS 病例編號,
       c.age_group AS 年齡區間,
       c.tcm_disease AS 中醫病名
FROM clinical_case AS c
JOIN case_formula AS cf ON c.case_id = cf.case_id
JOIN formula_herb AS fh ON cf.formula_id = fh.formula_id
JOIN herb AS h ON fh.herb_id = h.herb_id
WHERE h.herb_name = '當歸'
ORDER BY c.case_id;`;
const noPrescription = `SELECT c.case_id AS 病例編號,
       c.chief_complaint AS 主訴
FROM clinical_case AS c
WHERE NOT EXISTS (
  SELECT 1 FROM case_formula AS cf
  WHERE cf.case_id = c.case_id
)
ORDER BY c.case_id;`;

export const questions = [
 {id:'Q01',title:'找出 50 歲以上的病例',group:'條件篩選',level:'入門',tags:['WHERE','IN'],tables:['clinical_case'],prompt:'研究助理想先檢視 50 歲以上的教學病例。請列出病例編號、年齡區間與中醫病名。',sql:age,variant:age.replace("'50–59', '60+'","'40–49', '50–59', '60+'"),expected:14,modified:26,before:'50 歲以上',after:'40 歲以上',why:'把 40–49 加入 IN 清單，會多納入這個年齡區間的 12 筆病例。原本的 14 筆仍符合條件，所以總數變成 26 筆。',steps:['FROM 指定病例表。','WHERE 以年齡區間篩選；文字區間用 IN 明確列舉。','ORDER BY 讓病例依編號排列，方便比較。'],takeaway:'年齡區間以文字分類儲存，使用 IN 列舉要納入的區間。'},
 {id:'Q02',title:'主證為肝鬱脾虛的病例',group:'條件篩選',level:'入門',tags:['JOIN','WHERE'],tables:['clinical_case','case_syndrome','syndrome'],prompt:'中醫師希望查閱主證為肝鬱脾虛的病例。請透過病例證型關聯，列出病例編號、年齡區間與證型。',sql:primary,variant:primary.replace("\n  AND cs.syndrome_role = 'primary'",''),expected:12,modified:13,before:'只納入主證',after:'主證、次證皆納入',why:'移除主證條件後，CASE-016 以次證「肝鬱脾虛」加入結果。JOIN 只配對關聯，是否只取主證必須明確寫入 WHERE。',steps:['JOIN 將病例連到中介表，再連到證型字典。','用 syndrome_name 指定證型。','syndrome_role 限制這個證型在病例中必須是主證。'],takeaway:'同一個證型，在不同病例裡可能扮演不同角色。'},
 {id:'Q03',title:'明確記載失眠的病例',group:'條件篩選',level:'入門',tags:['JOIN','AND'],tables:['clinical_case','case_symptom','symptom'],prompt:'研究助理需要有「失眠」陽性症狀的病例。請排除明確否認失眠的紀錄，並顯示症狀狀態。',sql:insomnia,variant:insomnia.replace("\n  AND cs.status = 'present'",''),expected:9,modified:13,before:'有失眠（present）',after:'忽略症狀狀態',why:'多出 4 筆 status = absent 的病例。它們的症狀狀態是「否認失眠」。其餘 35 筆的失眠觀察狀態為未記載。',steps:['找到名稱為失眠的症狀。','透過中介表找出曾記錄此症狀的病例。','再用 present 排除陰性記錄。'],takeaway:'present、absent、未記載是三種不同意思。'},
 {id:'Q04',title:'一份病例，有幾個證型？',group:'資料連結',level:'基礎',tags:['JOIN','一對多'],tables:['clinical_case','case_syndrome','syndrome'],prompt:'列出所有病例及其主證與次證，觀察為什麼 48 筆病例 JOIN 後可以得到超過 48 列。',sql:allSyndromes,variant:allSyndromes.replace('ORDER BY',"WHERE cs.syndrome_role = 'primary'\nORDER BY"),expected:54,modified:48,before:'所有證型關聯',after:'僅主證關聯',why:'48 筆病例各有一個主證，另有 6 個次證關聯。JOIN 輸出的是配對列，所以有 54 列；限制 primary 後剩下 48 列。',steps:['由病例走到 case_syndrome。','一個病例有兩個證型就輸出兩列。','保留 syndrome_role，清楚解釋每一列的角色。'],takeaway:'COUNT(*) 計算關聯列數，COUNT(DISTINCT case_id) 計算病例數。'},
 {id:'Q05',title:'各主證分別有多少病例？',group:'分組統計',level:'基礎',tags:['GROUP BY','COUNT'],tables:['syndrome','case_syndrome'],prompt:'研究助理要統計各主證的病例數，並由多到少排列。只計 primary，避免次證重複計入。',sql:grouping,variant:`SELECT COUNT(*) AS 總病例數\nFROM case_syndrome\nWHERE syndrome_role = 'primary';`,expected:8,modified:1,before:'每個證型分組',after:'全部主證合計',why:'GROUP BY 把 48 筆主證分成 8 組，分別是 12、9、7、6、5、4、3、2 筆。不分組則只有一列總計 48。修改版也移除證型名稱，避免 SQLite 的非分組欄位顯示任意名稱。',steps:['先用 WHERE 留下主證。','GROUP BY 用證型編號與名稱分組。','COUNT(*) 統計每一組的關聯列數。'],takeaway:'拿掉 GROUP BY 時，也要重新考慮 SELECT 的顯示欄位。'},
 {id:'Q06',title:'篩出至少 7 例的主證',group:'分組統計',level:'基礎',tags:['HAVING','COUNT'],tables:['syndrome','case_syndrome'],prompt:'只顯示病例數至少 7 筆的主證。分組後的條件應放在 HAVING。',sql:having,variant:having.replace('>= 7','>= 5'),expected:3,modified:5,before:'至少 7 例',after:'至少 5 例',why:'門檻從 7 降到 5，會多納入肝胃不和（6 例）與心脾兩虛（5 例）。WHERE 先篩資料列；HAVING 再篩聚合後的組別。',steps:['WHERE 先限制 primary。','GROUP BY 形成每一個證型的組別。','HAVING 在 COUNT 完成後篩選組別。'],takeaway:'WHERE 篩列；HAVING 篩組。'},
 {id:'Q07',title:'拆解逍遙散的藥材組成',group:'資料連結',level:'基礎',tags:['JOIN','ORDER BY'],tables:['formula','formula_herb','herb'],prompt:'查出逍遙散有哪些組成藥材，依照來源記錄的組成順序顯示。',sql:ingredients,variant:ingredients.replace("'逍遙散'","'歸脾湯'"),expected:8,modified:12,before:'逍遙散',after:'歸脾湯',why:'兩次使用完全相同的三表 JOIN，只更換方劑名稱。來源字典記錄逍遙散 8 個組成、歸脾湯 12 個組成；包含薑棗等來源列出的組成。比較以「藥材名稱＋組成順序」為一列，同名藥材的順序改變時，也會呈現一列移除與一列新增。',steps:['formula 找到方劑。','formula_herb 取得其藥材編號與順序。','herb 將編號換成可讀的藥材名稱。'],takeaway:'同一個 JOIN 路徑可以回答不同方劑的組成問題。'},
 {id:'Q08',title:'找出從未使用的方劑',group:'資料連結',level:'基礎',tags:['LEFT JOIN','IS NULL'],tables:['formula','case_formula'],prompt:'保留所有方劑，找出沒有任何病例用方紀錄的方劑。',sql:unused,variant:unused.replace('LEFT JOIN','INNER JOIN'),expected:2,modified:0,before:'LEFT JOIN',after:'INNER JOIN',why:'六味地黃丸與一貫煎沒有病例關聯。LEFT JOIN 保留兩方，右側 case_id 為 NULL；INNER JOIN 先把未配對的方劑排除，之後再找 NULL 就沒有結果。',steps:['從完整方劑字典出發。','LEFT JOIN 保留未配對的左表資料。','用右表主鍵 IS NULL 識別無關聯者。'],takeaway:'查詢零筆關聯時，先用 LEFT JOIN 保留左表資料，再以 IS NULL 篩選。'},
 {id:'Q09',title:'同時含當歸與炙甘草的方劑',group:'進階練習',level:'進階',tags:['HAVING','DISTINCT'],tables:['formula','formula_herb','herb'],prompt:'找出同時具有當歸和炙甘草的方劑，注意這兩種藥材會出現在不同的組成列。',sql:both,variant:both.replace('= 2','>= 1'),expected:3,modified:6,before:'兩種都包含',after:'至少包含一種',why:'WHERE IN 先保留兩種候選藥材，HAVING COUNT(DISTINCT) = 2 要求兩種都有，得到逍遙散、八珍湯、歸脾湯。改成 >= 1，另加入小柴胡湯、二陳湯、一貫煎。',steps:['IN 在每列保留當歸或炙甘草。','按方劑分組，把不同組成列放回同一組。','COUNT(DISTINCT) = 2 檢查兩種藥材是否齊全。'],takeaway:'一列的藥材名稱不可能同時等於兩個名稱；「皆包含」需跨列聚合。'},
 {id:'Q10',title:'方劑使用次數，包含零次',group:'分組統計',level:'基礎',tags:['LEFT JOIN','COUNT'],tables:['formula','case_formula'],prompt:'統計每種方劑被幾份病例使用。未使用的方劑也必須顯示 0。',sql:usage,variant:usage.replace('COUNT(cf.case_id)','COUNT(*)'),expected:10,modified:10,before:'COUNT(cf.case_id)',after:'COUNT(*)',why:'兩次結果都有 10 列，但兩個未使用方劑的計數由 0 變為 1。COUNT(欄位) 忽略 NULL；COUNT(*) 會把 LEFT JOIN 為未配對方劑保留的空配對列也算進去。',steps:['LEFT JOIN 讓十個方劑都保留。','以方劑分組。','COUNT(cf.case_id) 計算右表有值的病例編號。'],takeaway:'比較結果時，同時查看列數與各儲存格的內容。'},
 {id:'Q11',title:'從當歸，追溯到使用病例',group:'進階練習',level:'進階',tags:['多表 JOIN','DISTINCT'],tables:['clinical_case','case_formula','formula_herb','herb'],prompt:'沿著病例、方劑、組成與藥材的關聯，找出使用過含當歸方劑的病例。',sql:herbCases,variant:herbCases.replace("'當歸'","'炙甘草'"),expected:24,modified:34,before:'方劑含當歸',after:'方劑含炙甘草',why:'含當歸且曾使用的方劑是逍遙散、八珍湯、歸脾湯，共 24 例；改成炙甘草再加小柴胡湯 6 例、二陳湯 4 例，成為 34 例。一貫煎雖含當歸，但沒有病例使用。',steps:['case_formula 把病例連到使用方劑。','formula_herb 把方劑展開成組成。','用藥材名稱篩選，DISTINCT 避免未來多方資料重複列出同一病例。'],takeaway:'多表 JOIN 可以從最末端的藥材條件追溯到最上游的病例。'},
 {id:'Q12',title:'哪些病例尚無處方紀錄？',group:'進階練習',level:'進階',tags:['NOT EXISTS','NULL'],tables:['clinical_case','case_formula'],prompt:'列出沒有任何用方紀錄的病例，用 NOT EXISTS 表達「不存在符合的關聯」。',sql:noPrescription,variant:`SELECT c.case_id AS 病例編號,\n       c.chief_complaint AS 主訴\nFROM clinical_case AS c\nINNER JOIN case_formula AS cf ON c.case_id = cf.case_id\nWHERE cf.case_id IS NULL\nORDER BY c.case_id;`,expected:2,modified:0,before:'NOT EXISTS',after:'INNER JOIN 再找 NULL',why:'CASE-011 與 CASE-012 沒有處方關聯。NOT EXISTS 逐筆檢查是否沒有對應紀錄；INNER JOIN 會先排除這兩筆，因此後續 IS NULL 篩選得到 0 筆。',steps:['逐一檢視病例。','子查詢以相同 case_id 檢查用方紀錄。','NOT EXISTS 在沒有任何配對時才保留病例。'],takeaway:'NOT EXISTS 與 LEFT JOIN / IS NULL 都能表達反連結。'},
];
