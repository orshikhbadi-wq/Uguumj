"""Import the two catalogue tabs without changing their source values."""
import datetime, hashlib, json, pathlib, sys
import openpyxl
source = pathlib.Path(sys.argv[1])
workbook = openpyxl.load_workbook(source, data_only=True, read_only=True)
def records(tab):
    rows = iter(workbook[tab].values)
    headers = next(rows)
    return [{key: value for key, value in zip(headers, row) if key} for row in rows if row[0] is not None]
products = records('01_Products')
categories = records('02_Categories')
assert len(products) == 23, f'Expected 23 source products, found {len(products)}'
assert len({row['product_id'] for row in products}) == 23
snapshot = {
    'spreadsheetId': '1aSXR7LSSiw-grl9ALPXhsX8DWLMUaNPKgNn6hrpxY_E',
    'spreadsheetName': 'Uguumj Online Store Database',
    'capturedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
    'commercialDataApproved': False,
    'products': products,
    'categories': categories,
}
destination = pathlib.Path(__file__).resolve().parent.parent / 'data/catalogue-snapshot.json'
destination.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2, default=str)+'\n')
print(json.dumps({'products':len(products),'categories':len(categories),'snapshot':str(destination)}))
