"""
Smart Excel (.xlsx, .xls) and CSV Roster Parser Service
Deterministic heuristic column detection + data cleaning.
Guarantees 0 junk rows and 0 `Ismsiz` entries.
"""
from typing import List, Dict, Any, Optional, Tuple
import io
import re
import csv
import zipfile
import xml.etree.ElementTree as ET
from pydantic import BaseModel

class ParsedStudent(BaseModel):
    orderIndex: int
    fullName: str
    firstName: str
    lastName: str
    middleName: Optional[str] = None
    emaktabId: Optional[str] = None
    gender: str = "M"
    birthDate: str = "2009-01-01"
    group: Optional[str] = None
    status: str = "eligible"

class ParseFileResult(BaseModel):
    success: bool
    fileName: str
    detectedGroup: Optional[str] = None
    detectedClass: Optional[str] = None
    totalParsed: int
    students: List[ParsedStudent]
    warnings: List[str] = []
    error: Optional[str] = None


def detect_class_from_name_or_text(text: str) -> Optional[str]:
    """Fayl nomi yoki sarlavhadan sinf nomini aniqlash (masalan: 10-V, 11-A, 9-B)"""
    m = re.search(r'(?:^|[^0-9])(1[0-1]|[1-9])[-_\s]*([A-Za-zА-Яа-я])(?=[^A-Za-zА-Яа-я0-9]|$)', text)
    if m:
        grade = m.group(1)
        letter = m.group(2).upper()
        cyr_to_lat = {'А': 'A', 'В': 'V', 'Б': 'B', 'Г': 'G', 'Д': 'D'}
        letter = cyr_to_lat.get(letter, letter)
        return f"{grade}-{letter}"
    return None


def detect_group_from_name_or_text(text: str) -> Optional[str]:
    """Fayl nomi yoki sarlavhadan guruhni aniqlash"""
    if re.search(r'(?:2|II)[-_\s.]*(?:gurux|guruh)', text, re.IGNORECASE):
        return '2-guruh'
    if re.search(r'(?:1|I)[-_\s.]*(?:gurux|guruh)', text, re.IGNORECASE):
        return '1-guruh'
    return None


def infer_gender_from_name(full_name: str, explicit_gender: Optional[str] = None) -> str:
    """Jinsni aniqlash (M yoki F)"""
    if explicit_gender:
        g = explicit_gender.strip().upper()
        if g in ['F', 'AYOL', 'QIZ']:
            return 'F'
        if g in ['M', 'ERKAK', "O'G'IL", 'OGIL']:
            return 'M'

    words = full_name.lower().split()
    for w in words:
        if w in ['qizi', 'ayol', 'qiz', 'қизи', 'кизи', 'аёл', 'қиз']:
            return 'F'
        if w in ["o'g'li", "o‘g‘li", "og'li", "erkak", 'ўғли', 'угли', 'эркак']:
            return 'M'
        if w.endswith(('ova', 'eva', 'zoda', 'bonu', 'xon', 'ова', 'ева', 'зода', 'бону', 'хон', 'нур')):
            return 'F'
        if w.endswith(('ov', 'ev', 'bek', 'jon', 'boy', 'ов', 'ев', 'бек', 'жон', 'бой', 'назар')):
            return 'M'

    return 'M'


def split_full_name(name: str) -> Tuple[str, str, Optional[str]]:
    """Familiya, Ism, Sharifga ajratish"""
    cleaned = re.sub(r'^\d+[\s.)-]+', '', name.strip())
    cleaned = re.sub(r'["\']+', '', cleaned).strip()
    words = cleaned.split()

    if len(words) == 0:
        return ('O\'quvchi', 'Ism', None)
    if len(words) == 1:
        return ('O\'quvchi', words[0], None)
    if len(words) == 2:
        return (words[0], words[1], None)

    # 3 yoki undan ortiq so'z (masalan: "Abduraximova Zuxra Farxod qizi")
    last_name = words[0]
    first_name = words[1]
    middle_name = " ".join(words[2:])
    return (last_name, first_name, middle_name)


def is_metadata_or_header_cell(val: str) -> bool:
    """Sarlavha yoki metama'lumot katakchalari ekanligini tekshirish"""
    lower = val.lower().strip()
    return (
        lower.startswith('sinf:')
        or lower.startswith('fan:')
        or lower.startswith('o‘qituvchi')
        or lower.startswith("o'qituvchi")
        or lower.startswith('maktab:')
        or lower.startswith('chorak:')
        or lower.startswith('baholab')
        or lower.startswith('imtihon sahifasi')
        or 'http://' in lower
        or 'https://' in lower
        or '^next_part^' in lower
        or 'jurnal' in lower
        or 'elektron' in lower
        or 'o\'quv yili' in lower
        or 'o‘quv yili' in lower
        or 'o‘quvchining ism' in lower
        or "o'quvchining ism" in lower
        or 'kundalik baho' in lower
        or 'baholanmagan' in lower
        or lower in [
            't/r', '№', 'x/x №', 'x/x', 'id', 'emaktab id', 'f.i.sh', 'f.i.sh.',
            'fish', 'familiya', 'ism', "o'quvchi", 'o‘quvchi', 'pin', 'jinsi',
            'jins', 'izoh', 'jami', 'baho', 'fb', 'oy', 'son',
        ]
    )


def is_valid_student_name(val: str) -> bool:
    """Yaroqli o'quvchi ismi ekanligini qat'iy tekshirish"""
    cleaned = re.sub(r'^\d+[\s.)-]+', '', val.strip())
    if len(cleaned) < 3:
        return False
    # Unicode replacement karakteri yoki bo'sh ismlarni qat'iyan rad etish
    if '\ufffd' in cleaned or 'ismsiz' in cleaned.lower() or 'unknown' in cleaned.lower():
        return False
    # Raqamlar yoki belgilardan iborat qatorlarni rad etish
    letters = re.findall(r'[a-zA-Zа-яА-ЯoʻgʻshchOʻGʻSHCH]', cleaned)
    if len(letters) < 3:
        return False
    # Metama'lumot bo'lsa rad etish
    if is_metadata_or_header_cell(cleaned):
        return False
    return True


def read_xls_rows(file_bytes: bytes) -> List[List[str]]:
    """XLRD orqali .xls faylining barcha varaqlarini o'qish"""
    import xlrd
    book = xlrd.open_workbook(file_contents=file_bytes)
    rows: List[List[str]] = []
    for sheet in book.sheets():
        for r in range(sheet.nrows):
            row_vals: List[str] = []
            for c in range(sheet.ncols):
                val = sheet.cell_value(r, c)
                if isinstance(val, float) and val.is_integer():
                    row_vals.append(str(int(val)))
                elif val is not None:
                    row_vals.append(str(val).strip())
                else:
                    row_vals.append('')
            if any(v for v in row_vals):
                rows.append(row_vals)
    return rows


def read_xlsx_rows(file_bytes: bytes) -> List[List[str]]:
    """ZIP va XML orqali to'g'ridan-to'g'ri .xlsx faylini o'qish (nol dependency)"""
    bio = io.BytesIO(file_bytes)
    rows: List[List[str]] = []
    with zipfile.ZipFile(bio, 'r') as zf:
        # 1. Shared Strings ni o'qish
        shared_strings: List[str] = []
        if 'xl/sharedStrings.xml' in zf.namelist():
            sst_xml = ET.fromstring(zf.read('xl/sharedStrings.xml'))
            ns = {'ns': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
            for si in sst_xml.findall('.//ns:si', ns):
                text_elems = si.findall('.//ns:t', ns)
                combined = "".join(elem.text or '' for elem in text_elems)
                shared_strings.append(combined)

        # 2. Birinchi ishchi varaq (sheet1.xml)
        sheet_path = 'xl/worksheets/sheet1.xml'
        if sheet_path not in zf.namelist():
            sheets = [n for n in zf.namelist() if n.startswith('xl/worksheets/sheet') and n.endswith('.xml')]
            if sheets:
                sheet_path = sheets[0]

        if sheet_path in zf.namelist():
            sheet_xml = ET.fromstring(zf.read(sheet_path))
            ns = {'ns': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
            for row_elem in sheet_xml.findall('.//ns:row', ns):
                row_vals: List[str] = []
                for c in row_elem.findall('.//ns:c', ns):
                    t = c.attrib.get('t')
                    v = c.find('ns:v', ns)
                    val_str = ''
                    if v is not None and v.text is not None:
                        if t == 's':
                            idx = int(v.text)
                            if 0 <= idx < len(shared_strings):
                                val_str = shared_strings[idx]
                        else:
                            val_str = v.text
                    elif c.find('ns:is/ns:t', ns) is not None:
                        val_str = c.find('ns:is/ns:t', ns).text or ''
                    row_vals.append(val_str.strip())
                if any(v for v in row_vals):
                    rows.append(row_vals)
    return rows


def read_csv_rows(file_bytes: bytes) -> List[List[str]]:
    """CSV / TSV fayllarni turli kodlashlar va ajratuvchilar bilan o'qish"""
    for encoding in ['utf-8-sig', 'utf-8', 'windows-1251', 'latin-1', 'cp1254']:
        try:
            text = file_bytes.decode(encoding)
        except Exception:
            continue
        sample_lines = [ln for ln in text.splitlines()[:10] if ln.strip()]
        sample = "\n".join(sample_lines)
        delimiter = None
        if sample:
            counts = {d: sum(ln.count(d) for ln in sample_lines[:5]) for d in ('\t', ';', ',')}
            best_delim, best_count = max(counts.items(), key=lambda kv: kv[1])
            if best_count > 0:
                delimiter = best_delim
        if not delimiter:
            try:
                delimiter = csv.Sniffer().sniff(text[:2048]).delimiter
            except Exception:
                delimiter = ','

        reader = csv.reader(text.splitlines(), delimiter=delimiter)
        rows = [[col.strip() for col in row] for row in reader if any(c.strip() for c in row)]
        if rows:
            return rows
    return []


def parse_rows_to_students(rows: List[List[str]], default_group: str = '1-guruh') -> List[ParsedStudent]:
    """Qatorlardan ustunlarni avtomatik aniqlab, o'quvchilarni shakllantirish"""
    students: List[ParsedStudent] = []

    # 1. Sarlavha qatorini qidirish (ilk 15 qatordan)
    header_idx = -1
    id_col = -1
    name_col = -1
    gender_col = -1
    group_col = -1

    for r_idx, row in enumerate(rows[:15]):
        row_lower = [c.lower() for c in row]
        has_id = any('id' in c or 'emaktab' in c for c in row_lower)
        has_name = any('f.i.sh' in c or 'fish' in c or 'familiya' in c or 'ism' in c or 'o\'quvchi' in c or 'name' in c for c in row_lower)
        if has_name or (has_id and len(row) >= 2):
            header_idx = r_idx
            for c_idx, c_val in enumerate(row_lower):
                if 'id' in c_val or 'emaktab' in c_val or 'kod' in c_val:
                    if id_col == -1: id_col = c_idx
                elif 'f.i.sh' in c_val or 'fish' in c_val or 'familiya' in c_val or 'ism' in c_val or 'o\'quvchi' in c_val or 'name' in c_val:
                    if name_col == -1: name_col = c_idx
                elif 'jinsi' in c_val or 'jins' in c_val or 'pol' in c_val or 'gender' in c_val:
                    if gender_col == -1: gender_col = c_idx
                elif 'guruh' in c_val or 'gurux' in c_val or 'group' in c_val:
                    if group_col == -1: group_col = c_idx
            break

    # 2. Qatorlarni tahlil qilish
    start_row = header_idx + 1 if header_idx != -1 else 0
    current_order = 1

    for row in rows[start_row:]:
        if not row or not any(row):
            continue

        raw_name = ""
        emaktab_id = None
        explicit_gender = None
        row_group = default_group

        # Agar ustunlar sarlavhadan aniqlangan bo'lsa
        if name_col != -1 and name_col < len(row):
            raw_name = row[name_col]
            if id_col != -1 and id_col < len(row) and re.search(r'\d{7,}', row[id_col]):
                emaktab_id = re.search(r'\d{7,}', row[id_col]).group(0)
            if gender_col != -1 and gender_col < len(row):
                explicit_gender = row[gender_col]
            if group_col != -1 and group_col < len(row) and ('1' in row[group_col] or '2' in row[group_col]):
                row_group = '2-guruh' if '2' in row[group_col] else '1-guruh'
        else:
            # Heuristic: har bir katakchani skanerlash
            for cell in row:
                if not cell:
                    continue
                # eMaktab ID raqami (7 dan 14 gacha raqam)
                if not emaktab_id and re.fullmatch(r'\d{7,14}', cell):
                    emaktab_id = cell
                # Jinsi (M yoki F yoki Erkak/Ayol)
                elif not explicit_gender and cell.upper() in ['M', 'F', 'ERKAK', 'AYOL', "O'G'IL", 'QIZ']:
                    explicit_gender = cell
                # Guruh
                elif '1-gur' in cell.lower() or '2-gur' in cell.lower():
                    row_group = '2-guruh' if '2' in cell else '1-guruh'
                # Ism-sharif
                elif not raw_name and is_valid_student_name(cell):
                    raw_name = cell

        # Agar ism bo'lsa-yu, emaktab_id hali aniqlanmagan bo'lsa, qatordagi barcha katakchalarni tekshirish
        if not emaktab_id:
            for c_idx, cell in enumerate(row):
                if c_idx != name_col:
                    m = re.search(r'\b\d{7,14}\b', str(cell).strip())
                    if m:
                        emaktab_id = m.group(0)
                        break

        # Agar ism topilmasa yoki yaroqsiz bo'lsa, boshqa katakchalardan tekshirish
        if not is_valid_student_name(raw_name):
            for c_idx, cell in enumerate(row):
                cand = str(cell).strip()
                if is_valid_student_name(cand):
                    raw_name = cand
                    break

        # Agar ism topilmasa yoki yaroqsiz bo'lsa, qat'iyan chetlab o'tish (0 junk!)
        if not is_valid_student_name(raw_name):
            continue

        last_name, first_name, middle_name = split_full_name(raw_name)
        gender = infer_gender_from_name(raw_name, explicit_gender)

        students.append(
            ParsedStudent(
                orderIndex=current_order,
                fullName=raw_name.strip(),
                firstName=first_name,
                lastName=last_name,
                middleName=middle_name,
                emaktabId=emaktab_id,
                gender=gender,
                birthDate="2009-01-01",
                group=row_group,
                status="eligible",
            )
        )
        current_order += 1

    return students


def parse_excel_or_csv_file(file_name: str, file_bytes: bytes, group_override: Optional[str] = None) -> ParseFileResult:
    """Istalgan .xlsx, .xls yoki .csv faylni to'liq xatosiz tahlil qilish"""
    lower_name = file_name.lower()
    detected_group = group_override or detect_group_from_name_or_text(file_name)
    detected_class = detect_class_from_name_or_text(file_name)

    try:
        if lower_name.endswith('.xls'):
            rows = read_xls_rows(file_bytes)
        elif lower_name.endswith('.xlsx'):
            rows = read_xlsx_rows(file_bytes)
        else:
            rows = read_csv_rows(file_bytes)

        if not rows:
            return ParseFileResult(
                success=False,
                fileName=file_name,
                detectedGroup=detected_group,
                detectedClass=detected_class,
                totalParsed=0,
                students=[],
                error="Fayl bo'sh yoki o'qib bo'lmadi."
            )

        for r in rows[:10]:
            row_str = " ".join(r)
            if not detected_class:
                cls_found = detect_class_from_name_or_text(row_str)
                if cls_found:
                    detected_class = cls_found
            if not detected_group:
                grp_found = detect_group_from_name_or_text(row_str)
                if grp_found:
                    detected_group = grp_found

        students = parse_rows_to_students(rows, default_group=detected_group)

        return ParseFileResult(
            success=True,
            fileName=file_name,
            detectedGroup=detected_group,
            detectedClass=detected_class,
            totalParsed=len(students),
            students=students,
            warnings=[]
        )
    except Exception as e:
        return ParseFileResult(
            success=False,
            fileName=file_name,
            detectedGroup=detected_group,
            detectedClass=detected_class,
            totalParsed=0,
            students=[],
            error=f"Faylni tahlil qilishda xatolik yuz berdi: {str(e)}"
        )
