import pytest
import io
import zipfile
from backend.app.services.excel_parser import (
    detect_group_from_name_or_text,
    detect_class_from_name_or_text,
    split_full_name,
    infer_gender_from_name,
    is_valid_student_name,
    parse_rows_to_students,
    parse_excel_or_csv_file,
)

def test_detect_group_from_name_or_text():
    assert detect_group_from_name_or_text("11-A_Informatika_1-gurux.xls") == "1-guruh"
    assert detect_group_from_name_or_text("11-A_Informatika_2-gurux.xls") == "2-guruh"
    assert detect_group_from_name_or_text("11-A (1-guruh)") == "1-guruh"
    assert detect_group_from_name_or_text("11-A (2-guruh)") == "2-guruh"
    assert detect_group_from_name_or_text("Matematika 9-A") is None

def test_detect_class_from_name_or_text():
    assert detect_class_from_name_or_text("10-V-Informatika-20_11_2026.xls") == "10-V"
    assert detect_class_from_name_or_text("11-A_Informatika.xls") == "11-A"
    assert detect_class_from_name_or_text("Sinf: 10-V 2026/2027") == "10-V"
    assert detect_class_from_name_or_text("9-B sinf") == "9-B"

def test_split_full_name():
    last, first, mid = split_full_name("Abduraximova Zuxra Farxod qizi")
    assert last == "Abduraximova"
    assert first == "Zuxra"
    assert mid == "Farxod qizi"

    last, first, mid = split_full_name("Ergashev Jasurbek")
    assert last == "Ergashev"
    assert first == "Jasurbek"
    assert mid is None

def test_infer_gender_from_name():
    assert infer_gender_from_name("Abduraximova Zuxra Farxod qizi") == "F"
    assert infer_gender_from_name("Ergashev Jasur Akram o'g'li") == "M"
    assert infer_gender_from_name("Bozorova Dilfuza") == "F"
    assert infer_gender_from_name("Zokirov Alisher") == "M"
    # Cyrillic names
    assert infer_gender_from_name("Давлаталиев Жахонгир") == "M"
    assert infer_gender_from_name("Жўнашова Мохинур") == "F"
    assert infer_gender_from_name("Исакбоева Мохирабону") == "F"
    assert infer_gender_from_name("Some Student", explicit_gender="Ayol") == "F"
    assert infer_gender_from_name("Some Student", explicit_gender="Erkak") == "M"

def test_is_valid_student_name():
    assert is_valid_student_name("Abduraximova Zuxra") is True
    assert is_valid_student_name("1. Abduraximova Zuxra") is True
    # Rejects junk and metadata
    assert is_valid_student_name("") is False
    assert is_valid_student_name("Ismsiz") is False
    assert is_valid_student_name(" Ismsiz") is False
    assert is_valid_student_name("Sinf: 11-A (1-gurux)") is False
    assert is_valid_student_name("Fan: Informatika") is False
    assert is_valid_student_name("1000001990090") is False
    assert is_valid_student_name("T/r") is False

def test_parse_rows_to_students():
    rows = [
        ["Sinf: 11-A (1-gurux) 2026/2027 o'quv yili"],
        ["Fan: Informatika va axborot texnologiyalari"],
        ["O'qituvchi: Yunusov Dilmurod Rahmataliyevich"],
        ["T/r", "eMaktab ID", "O'quvchi F.I.SH", "Jinsi"],
        ["1", "1000001990090", "Abduraximova Zuxra Farxod qizi", "F"],
        ["2", "1000001990100", "Bozorova Dilfuza Sherzod qizi", "F"],
        ["3", "1000002155432", "Ergashev Jasur Akram o'g'li", "M"],
    ]

    students = parse_rows_to_students(rows, default_group="1-guruh")
    assert len(students) == 3

    assert students[0].fullName == "Abduraximova Zuxra Farxod qizi"
    assert students[0].emaktabId == "1000001990090"
    assert students[0].gender == "F"
    assert students[0].group == "1-guruh"

    assert students[2].fullName == "Ergashev Jasur Akram o'g'li"
    assert students[2].emaktabId == "1000002155432"
    assert students[2].gender == "M"
    assert students[2].group == "1-guruh"

def test_parse_excel_or_csv_file_with_csv():
    csv_content = """T/r,eMaktab ID,O'quvchi F.I.SH,Jinsi
1,1000001990090,Abduraximova Zuxra Farxod qizi,F
2,1000001990100,Bozorova Dilfuza Sherzod qizi,F
"""
    res = parse_excel_or_csv_file("11-A_1-gurux.csv", csv_content.encode("utf-8"))
    assert res.success is True
    assert res.totalParsed == 2
    assert res.detectedGroup == "1-guruh"
    assert res.students[0].fullName == "Abduraximova Zuxra Farxod qizi"

def test_parse_excel_or_csv_file_with_xlsx():
    bio = io.BytesIO()
    with zipfile.ZipFile(bio, 'w') as zf:
        zf.writestr('xl/sharedStrings.xml', '<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="2"><si><t>Abduraximova Zuxra Farxod qizi</t></si><si><t>1000001990090</t></si></sst>')
        zf.writestr('xl/worksheets/sheet1.xml', '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="s"><v>1</v></c><c r="B1" t="s"><v>0</v></c></row></sheetData></worksheet>')

    res = parse_excel_or_csv_file("11-A_2-gurux.xlsx", bio.getvalue())
    assert res.success is True
    assert res.totalParsed == 1
    assert res.detectedGroup == "2-guruh"
    assert res.students[0].fullName == "Abduraximova Zuxra Farxod qizi"


def test_parse_real_semicolon_quarter_csv_and_baholab_pin_rows():
    # Semicolon UTF-8 BOM Quarter CSV containing commas inside the Izoh column
    quarter_csv = (
        "\ufeff№;F.I.Sh.;eMaktab ID;FB (10);BSB (50);ChSB (40);Jami (100);Baho;Izoh\n"
        "1;Abdullayeva Dilafro‘z;1000003546584;;;34;;;kundalik baho yo'q, BSB-1 baholanmagan\n"
        "2;Иброхимова Азиза;1000001984711;;;;;;kundalik baho yo'q, BSB-1 baholanmagan, ChSB yo'q\n"
    ).encode("utf-8-sig")

    res = parse_excel_or_csv_file("10-A_1-gurux_1-chorak.csv", quarter_csv)
    assert res.success is True
    assert res.detectedClass == "10-A"
    assert res.detectedGroup == "1-guruh"
    assert res.totalParsed == 2
    assert res.students[0].fullName == "Abdullayeva Dilafro‘z"
    assert res.students[0].emaktabId == "1000003546584"
    assert res.students[1].fullName == "Иброхимова Азиза"
    assert res.students[1].emaktabId == "1000001984711"

    # BahoLab PIN export rows (must skip metadata/URL rows and keep only students)
    rows_pin = [
        ["BahoLab · 10-A (1-gurux) · Informatika", "", ""],
        ["Imtihon sahifasi: https://example.trycloudflare.com/t", "", ""],
        ["№", "O'quvchi", "PIN"],
        ["1", "Abdullayeva Dilafro‘z", "8663"],
        ["2", "Akbaraliyeva Shahlo", "6731"],
    ]
    parsed_pin = parse_rows_to_students(rows_pin, default_group="1-guruh")
    assert len(parsed_pin) == 2
    assert parsed_pin[0].fullName == "Abdullayeva Dilafro‘z"
    assert parsed_pin[0].emaktabId is None
