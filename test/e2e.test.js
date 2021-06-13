"use strict";
const APIGW_ENDPOINT = process.env.APIGW_ENDPOINT;
const request = require('supertest')(APIGW_ENDPOINT);
const _ = require('lodash');
const util = require('util');
const templateInvoice = {
    "key": "TO_BE_FILLED",
    "value": {
        "date": "2021-05-22",
        "billTo": "ABC Car Dealer Pte Ltd",
        "paymentStatus": "PENDING",
        "carInfo": {
            "model": "Honda",
            "make": "Jazz",
            "year": 2021,
            "unitPrice": 89000
        },
        "quantity": 10
    }
};
describe('Insert new invoice', () => {
    it('can insert 1 invoice', async () => {
        const invoiceNo = 'TEST10001';
        let dataArray = [];
        dataArray.push(_.cloneDeep(templateInvoice));
        dataArray[0].key = invoiceNo;
        const result = await request
            .post('/')
            .send(dataArray)
            .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(200);
        const res = result.body;
        expect(typeof res).toEqual('object');
        expect(res).toHaveProperty('documentId');
        expect(res).toHaveProperty('txId');
    });
    it('can insert 2 invoices', async () => {
        const invoice1No = 'TEST10011';
        const invoice2No = 'TEST10012';
        let dataArray = [];
        dataArray.push(_.cloneDeep(templateInvoice));
        dataArray.push(_.cloneDeep(templateInvoice));
        dataArray[0].key = invoice1No;
        dataArray[1].key = invoice2No;
        const result = await request
            .post('/')
            .send(dataArray)
            .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(200);
        const res = result.body;
        expect(Array.isArray(res)).toBe(true);
        res.forEach((r) => {
            expect(r).toHaveProperty('documentId');
            expect(r).toHaveProperty('txId');
        });
    });
    it('cannot insert 0 invoice', async () => {
        const result = await request
            .post('/')
            .send([])
            .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Invalid request body');
    });
    it('cannot insert more than 10 invoices', async () => {
        let dataArray = [];
        for (let i = 0; i < 11; i++) {
            const invoiceNo = `TEST1002${i}`;
            dataArray.push(_.cloneDeep(templateInvoice));
            dataArray[i].key = invoiceNo;
        }
        const result = await request
            .post('/')
            .send(dataArray)
            .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Invalid request body');
    });
    it('cannot insert invoice with improper format', async () => {
        let dataArray = [];
        dataArray.push(_.cloneDeep(templateInvoice));
        const invoiceNo = 'TEST10031';
        dataArray[0].key = invoiceNo;
        delete dataArray[0].value.billTo;
        const result = await request
            .post('/')
            .send(dataArray)
            .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Invalid request body');
    });
    it('cannot insert invoices with duplicate keys', async () => {
        const invoice1No = 'TEST10041';
        const invoice2No = 'TEST10041';
        let dataArray = [];
        dataArray.push(_.cloneDeep(templateInvoice));
        dataArray.push(_.cloneDeep(templateInvoice));
        dataArray[0].key = invoice1No;
        dataArray[1].key = invoice2No;
        const result = await request
            .post('/')
            .send(dataArray)
            .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Duplicate key');
    });
});
describe('Retrieve invoices', () => {
    it('can retrieve 1 invoice', async () => {
        const result = await request
            .get('/')
            .query({
            keys: 'TEST10001'
        })
            .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(200);
        const res = result.body;
        expect(typeof res).toEqual('object');
        expect(res).toHaveProperty('quantity');
        expect(res).toHaveProperty('date');
        expect(res).toHaveProperty('billTo');
        expect(res).toHaveProperty('carInfo');
    });
    it('can retrieve multiple invoices', async () => {
        const result = await request
            .get('/')
            .query({
            keys: 'TEST10001,TEST10012'
        })
            .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(200);
        const res = result.body;
        expect(Array.isArray(res)).toBe(true);
        expect(res.length).toEqual(2);
        res.forEach((r) => {
            expect(r).toHaveProperty('quantity');
            expect(r).toHaveProperty('date');
            expect(r).toHaveProperty('billTo');
            expect(r).toHaveProperty('carInfo');
        });
    });
    it('cannot retrieve more than 32 invoices at the same time', async () => {
        const result = await request
            .get('/')
            .query({
            keys: 'TEST10001,TEST10012,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,AA,AB,AC,AD,AE,AF,AG'
        })
            .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Requested records do not exist');
    });
    it('cannot retrieve invoices that do not exist', async () => {
        const result = await request
            .get('/')
            .query({
            keys: 'A,B'
        })
            .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Requested records do not exist');
    });
    it('cannot retrieve invoices without "keys" query string', async () => {
        const result = await request
            .get('/')
            .query({
            key: 'TEST10001'
        })
            .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Missing required request parameters');
    });
});
describe('Get invoice metadata by key', () => {
    it('can get 1 invoice metadata by key', async () => {
        const result = await request
            .get('/metadata-by-key')
            .query({
            key: 'TEST10001'
        });
        expect(result.statusCode).toEqual(200);
        const res = result.body;
        expect(typeof res).toEqual('object');
        expect(res).toHaveProperty('LedgerName');
        expect(res).toHaveProperty('TableName');
        expect(res).toHaveProperty('BlockAddress');
        expect(res).toHaveProperty('DocumentId');
        expect(res).toHaveProperty('RevisionHash');
        expect(res).toHaveProperty('Proof');
    });
    it('cannot get invoice metadata for key that does not exist', async () => {
        const result = await request
            .get('/metadata-by-key')
            .query({
            key: 'XYZ'
        });
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Could not get metadata');
    });
    it('cannot retrieve metadata without "key" query string', async () => {
        const result = await request
            .get('/metadata-by-key')
            .query({
            some_other_key: 'TEST10001'
        });
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Missing required request parameters');
    });
});
describe('Get invoice metadata by docId and txId', () => {
    it('can get 1 invoice metadata by docId and txId', async () => {
        const invoiceNo = 'TEST40001';
        let dataArray = [];
        dataArray.push(_.cloneDeep(templateInvoice));
        dataArray[0].key = invoiceNo;
        const info = await request
            .post('/')
            .send(dataArray)
            .set('Content-Type', 'application/json');
        expect(info.statusCode).toEqual(200);
        const docId = info.body.documentId;
        const txId = info.body.txId;
        const result = await request
            .get('/metadata-by-doc')
            .query({
            docId: docId,
            txId: txId
        });
        expect(result.statusCode).toEqual(200);
        const res = result.body;
        expect(typeof res).toEqual('object');
        expect(res).toHaveProperty('LedgerName');
        expect(res).toHaveProperty('TableName');
        expect(res).toHaveProperty('BlockAddress');
        expect(res).toHaveProperty('DocumentId');
        expect(res).toHaveProperty('RevisionHash');
        expect(res).toHaveProperty('Proof');
    });
    it('cannot get invoice metadata for docId and/or txId that do not exist', async () => {
        const result = await request
            .get('/metadata-by-doc')
            .query({
            docId: 'ABC',
            txId: 'XYZ'
        });
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Could not get metadata');
    });
    it('cannot retrieve metadata without "docId" and/or "txId" query string', async () => {
        const result = await request
            .get('/metadata-by-doc')
            .query({
            some_other_key: 'TEST10001'
        });
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Missing required request parameters');
    });
});
describe('Verify invoice metadata', () => {
    let metadata = {};
    beforeAll(async () => {
        const res = await request.get('/metadata-by-key')
            .query({
            key: 'TEST10001'
        });
        expect(res.statusCode).toEqual(200);
        metadata = res.body;
    });
    it('can verify 1 invoice metadata', async () => {
        const res = await request
            .post('/verify')
            .send(_.cloneDeep(metadata))
            .set('Content-Type', 'application/json');
        expect(res.statusCode).toEqual(200);
        const result = res.body;
        expect(typeof result).toEqual('object');
        expect(result).toHaveProperty('result');
    });
    it('cannot verify invoice metadata with improper format', async () => {
        const result = await request
            .post('/verify')
            .send({})
            .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Invalid request body');
    });
    it('cannot verify invoice metadata with incorrect block address', async () => {
        const m = _.cloneDeep(metadata);
        m.BlockAddress.IonText = "{strandId: \"abcdefghijklmnopqstuvw\", sequenceNo: 3}";
        const result = await request
            .post('/verify')
            .send(m)
            .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Could not verify the metadta');
    });
    it('cannot verify invoice metadata with incorrect documentId', async () => {
        const m = _.cloneDeep(metadata);
        m.DocumentId = 'abcdefghijklmnopqstuvw';
        const result = await request
            .post('/verify')
            .send(m)
            .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Could not verify the metadta');
    });
    it('cannot verify invoice metadata with incorrect documentId length (not 22 characters)', async () => {
        const m = _.cloneDeep(metadata);
        m.DocumentId = 'XYZ';
        const result = await request
            .post('/verify')
            .send(m)
            .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Invalid request body');
    });
    it('cannot verify invoice metadata with incorrect revision hash', async () => {
        const m = _.cloneDeep(metadata);
        m.RevisionHash = 'abcdefghijklmnopqstuvw';
        const result = await request
            .post('/verify')
            .send(m)
            .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Could not verify the metadta');
    });
    it('cannot verify invoice metadata with incorrect ledger digest', async () => {
        const m = _.cloneDeep(metadata);
        m.LedgerDigest.Digest = 'abcdefghijklmnopqstuvw';
        const result = await request
            .post('/verify')
            .send(m)
            .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Could not verify the metadta');
    });
    it('cannot verify invoice metadata with incorrect digest tip address', async () => {
        const m = _.cloneDeep(metadata);
        m.LedgerDigest.DigestTipAddress.IonText = "{strandId: \"abcdefghijklmnopqstuvw\", sequenceNo: 8}";
        const result = await request
            .post('/verify')
            .send(m)
            .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Could not verify the metadta');
    });
});
describe('Get document revision by metadata', () => {
    let metadata = {};
    beforeAll(async () => {
        const res = await request.get('/metadata-by-key')
            .query({
            key: 'TEST10001'
        });
        expect(res.statusCode).toEqual(200);
        metadata = res.body;
    });
    it('can retrieve 1 document revision by metadata', async () => {
        const res = await request
            .post('/revision')
            .send(_.cloneDeep(metadata))
            .set('Content-Type', 'application/json');
        expect(res.statusCode).toEqual(200);
        const result = res.body;
        expect(typeof result).toEqual('object');
        expect(result).toHaveProperty('Proof');
        expect(result).toHaveProperty('Revision');
    });
    it('cannot retrieve document revision with improper format', async () => {
        const result = await request
            .post('/revision')
            .send({})
            .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Invalid request body');
    });
    it('cannot retrieve document revision with incorrect block address', async () => {
        const m = _.cloneDeep(metadata);
        m.BlockAddress.IonText = "{strandId: \"abcdefghijklmnopqstuvw\", sequenceNo: 3}";
        const result = await request
            .post('/revision')
            .send(m)
            .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Could not get document revision');
    });
    it('cannot retrieve document revision with incorrect documentId', async () => {
        const m = _.cloneDeep(metadata);
        m.DocumentId = 'abcdefghijklmnopqstuvw';
        const result = await request
            .post('/revision')
            .send(m)
            .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Could not get document revision');
    });
    it('cannot retrieve document revision with incorrect documentId length (not 22 characters)', async () => {
        const m = _.cloneDeep(metadata);
        m.DocumentId = 'XYZ';
        const result = await request
            .post('/revision')
            .send(m)
            .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Invalid request body');
    });
    it('cannot retrieve document revision with incorrect digest tip address', async () => {
        const m = _.cloneDeep(metadata);
        m.LedgerDigest.DigestTipAddress.IonText = "{strandId: \"abcdefghijklmnopqstuvw\", sequenceNo: 8}";
        const result = await request
            .post('/revision')
            .send(m)
            .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Could not get document revision');
    });
});
describe('Retrieve invoice history', () => {
    it('can retrieve 1 invoice history', async () => {
        const result = await request
            .get('/history')
            .query({
            key: 'TEST10001'
        });
        expect(result.statusCode).toEqual(200);
        const res = result.body;
        expect(Array.isArray(res)).toBe(true);
        res.forEach((r) => {
            expect(r).toHaveProperty('blockAddress');
            expect(r).toHaveProperty('hash');
            expect(r).toHaveProperty('data');
            expect(r).toHaveProperty('metadata');
        });
    });
    it('cannot retrieve history for invoice that do not exist', async () => {
        const result = await request
            .get('/history')
            .query({
            key: 'A'
        });
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Could not get history');
    });
    it('cannot retrieve invoices without "key" query string', async () => {
        const result = await request
            .get('/history')
            .query({
            keys: 'TEST10001'
        });
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Missing required request parameters');
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZTJlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJlMmUudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsTUFBTSxjQUFjLEdBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUM7QUFDakQsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ3JELE1BQU0sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUM1QixNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7QUFFN0IsTUFBTSxlQUFlLEdBQUc7SUFDcEIsS0FBSyxFQUFFLGNBQWM7SUFDckIsT0FBTyxFQUFFO1FBQ0wsTUFBTSxFQUFFLFlBQVk7UUFDcEIsUUFBUSxFQUFFLHdCQUF3QjtRQUNsQyxlQUFlLEVBQUUsU0FBUztRQUMxQixTQUFTLEVBQUU7WUFDUCxPQUFPLEVBQUUsT0FBTztZQUNoQixNQUFNLEVBQUUsTUFBTTtZQUNkLE1BQU0sRUFBRSxJQUFJO1lBQ1osV0FBVyxFQUFFLEtBQUs7U0FDckI7UUFDRCxVQUFVLEVBQUUsRUFBRTtLQUNqQjtDQUNKLENBQUE7QUFFRCxRQUFRLENBQUMsb0JBQW9CLEVBQUUsR0FBRyxFQUFFO0lBQ2hDLEVBQUUsQ0FBQyxzQkFBc0IsRUFBRSxLQUFLLElBQUksRUFBRTtRQUNsQyxNQUFNLFNBQVMsR0FBRyxXQUFXLENBQUM7UUFDOUIsSUFBSSxTQUFTLEdBQUcsRUFBRSxDQUFDO1FBQ25CLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1FBQzdDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsU0FBUyxDQUFDO1FBRTdCLE1BQU0sTUFBTSxHQUFHLE1BQU0sT0FBTzthQUNILElBQUksQ0FBQyxHQUFHLENBQUM7YUFDVCxJQUFJLENBQUMsU0FBUyxD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LENBQUM7WUFDSCxJQUFJLEVBQUUsV0FBVztTQUNwQixDQUFDLENBQUE7UUFDMUIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdkMsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQztRQUN4QixNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3RDLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsU0FBUyxDQUFDLHFDQUFxQyxDQUFDLENBQUM7SUFDekUsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IEFQSUdXX0VORFBPSU5UPSBwcm9jZXNzLmVudi5BUElHV19FTkRQT0lOVDtcbmNvbnN0IHJlcXVlc3QgPSByZXF1aXJlKCdzdXBlcnRlc3QnKShBUElHV19FTkRQT0lOVCk7XG5jb25zdCBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5jb25zdCB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xuXG5jb25zdCB0ZW1wbGF0ZUludm9pY2UgPSB7XG4gICAgXCJrZXlcIjogXCJUT19CRV9GSUxMRURcIixcbiAgICBcInZhbHVlXCI6IHtcbiAgICAgICAgXCJkYXRlXCI6IFwiMjAyMS0wNS0yMlwiLFxuICAgICAgICBcImJpbGxUb1wiOiBcIkFCQyBDYXIgRGVhbGVyIFB0ZSBMdGRcIixcbiAgICAgICAgXCJwYXltZW50U3RhdHVzXCI6IFwiUEVORElOR1wiLFxuICAgICAgICBcImNhckluZm9cIjoge1xuICAgICAgICAgICAgXCJtb2RlbFwiOiBcIkhvbmRhXCIsXG4gICAgICAgICAgICBcIm1ha2VcIjogXCJKYXp6XCIsXG4gICAgICAgICAgICBcInllYXJcIjogMjAyMSxcbiAgICAgICAgICAgIFwidW5pdFByaWNlXCI6IDg5MDAwXG4gICAgICAgIH0sXG4gICAgICAgIFwicXVhbnRpdHlcIjogMTBcbiAgICB9XG59XG5cbmRlc2NyaWJlKCdJbnNlcnQgbmV3IGludm9pY2UnLCAoKSA9PiB7XG4gICAgaXQoJ2NhbiBpbnNlcnQgMSBpbnZvaWNlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBpbnZvaWNlTm8gPSAnVEVTVDEwMDAxJztcbiAgICAgICAgbGV0IGRhdGFBcnJheSA9IFtdO1xuICAgICAgICBkYXRhQXJyYXkucHVzaChfLmNsb25lRGVlcCh0ZW1wbGF0ZUludm9pY2UpKTtcbiAgICAgICAgZGF0YUFycmF5WzBdLmtleSA9IGludm9pY2VObztcblxuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByZXF1ZXN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5wb3N0KCcvJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNlbmQoZGF0YUFycmF5KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2V0KCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICBleHBlY3QocmVzdWx0LnN0YXR1c0NvZGUpLnRvRXF1YWwoMjAwKTtcbiAgICAgICAgY29uc3QgcmVzID0gcmVzdWx0LmJvZHk7XG4gICAgICAgIGV4cGVjdCh0eXBlb2YgcmVzKS50b0VxdWFsKCdvYmplY3QnKTtcbiAgICAgICAgZXhwZWN0KHJlcykudG9IYXZlUHJvcGVydHkoJ2RvY3VtZW50SWQnKTtcbiAgICAgICAgZXhwZWN0KHJlcykudG9IYXZlUHJvcGVydHkoJ3R4SWQnKTtcbiAgICB9KTtcblxuICAgIGl0KCdjYW4gaW5zZXJ0IDIgaW52b2ljZXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGludm9pY2UxTm8gPSAnVEVTVDEwMDExJztcbiAgICAgICAgY29uc3QgaW52b2ljZTJObyA9ICdURVNUMTAwMTInO1xuICAgICAgICBsZXQgZGF0YUFycmF5ID0gW107XG4gICAgICAgIGRhdGFBcnJheS5wdXNoKF8uY2xvbmVEZWVwKHRlbXBsYXRlSW52b2ljZSkpO1xuICAgICAgICBkYXRhQXJyYXkucHVzaChfLmNsb25lRGVlcCh0ZW1wbGF0ZUludm9pY2UpKTtcbiAgICAgICAgZGF0YUFycmF5WzBdLmtleSA9IGludm9pY2UxTm87XG4gICAgICAgIGRhdGFBcnJheVsxXS5rZXkgPSBpbnZvaWNlMk5vO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlcXVlc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnBvc3QoJy8nKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2VuZChkYXRhQXJyYXkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZXQoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgIGV4cGVjdChyZXN1bHQuc3RhdHVzQ29kZSkudG9FcXVhbCgyMDApO1xuICAgICAgICBjb25zdCByZXMgPSByZXN1bHQuYm9keTtcbiAgICAgICAgZXhwZWN0KEFycmF5LmlzQXJyYXkocmVzKSkudG9CZSh0cnVlKTtcbiAgICAgICAgcmVzLmZvckVhY2goKHI6IE9iamVjdCkgPT4ge1xuICAgICAgICAgICAgZXhwZWN0KHIpLnRvSGF2ZVByb3BlcnR5KCdkb2N1bWVudElkJyk7XG4gICAgICAgICAgICBleHBlY3QocikudG9IYXZlUHJvcGVydHkoJ3R4SWQnKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnY2Fubm90IGluc2VydCAwIGludm9pY2UnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlcXVlc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnBvc3QoJy8nKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2VuZChbXSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldCgnQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgZXhwZWN0KHJlc3VsdC5zdGF0dXNDb2RlKS50b0VxdWFsKDQwMCk7XG4gICAgICAgIGNvbnN0IHJlcyA9IHJlc3VsdC5ib2R5O1xuICAgICAgICBleHBlY3QocmVzKS50b0hhdmVQcm9wZXJ0eSgnbWVzc2FnZScpO1xuICAgICAgICBleHBlY3QocmVzLm1lc3NhZ2UpLnRvQ29udGFpbignSW52YWxpZCByZXF1ZXN0IGJvZHknKTtcbiAgICB9KTtcbiAgICBcbiAgICBpdCgnY2Fubm90IGluc2VydCBtb3JlIHRoYW4gMTAgaW52b2ljZXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGxldCBkYXRhQXJyYXkgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAxMTsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBpbnZvaWNlTm8gPSBgVEVTVDEwMDIke2l9YDtcbiAgICAgICAgICAgIGRhdGFBcnJheS5wdXNoKF8uY2xvbmVEZWVwKHRlbXBsYXRlSW52b2ljZSkpO1xuICAgICAgICAgICAgZGF0YUFycmF5W2ldLmtleSA9IGludm9pY2VObztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByZXF1ZXN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5wb3N0KCcvJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNlbmQoZGF0YUFycmF5KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2V0KCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICBleHBlY3QocmVzdWx0LnN0YXR1c0NvZGUpLnRvRXF1YWwoNDAwKTtcbiAgICAgICAgY29uc3QgcmVzID0gcmVzdWx0LmJvZHk7XG4gICAgICAgIGV4cGVjdChyZXMpLnRvSGF2ZVByb3BlcnR5KCdtZXNzYWdlJyk7XG4gICAgICAgIGV4cGVjdChyZXMubWVzc2FnZSkudG9Db250YWluKCdJbnZhbGlkIHJlcXVlc3QgYm9keScpO1xuICAgIH0pO1xuXG4gICAgaXQoJ2Nhbm5vdCBpbnNlcnQgaW52b2ljZSB3aXRoIGltcHJvcGVyIGZvcm1hdCcsIGFzeW5jICgpID0+IHtcbiAgICAgICAgbGV0IGRhdGFBcnJheSA9IFtdO1xuICAgICAgICBkYXRhQXJyYXkucHVzaChfLmNsb25lRGVlcCh0ZW1wbGF0ZUludm9pY2UpKTtcbiAgICAgICAgY29uc3QgaW52b2ljZU5vID0gJ1RFU1QxMDAzMSc7XG4gICAgICAgIGRhdGFBcnJheVswXS5rZXkgPSBpbnZvaWNlTm87XG4gICAgICAgIGRlbGV0ZSBkYXRhQXJyYXlbMF0udmFsdWUuYmlsbFRvO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlcXVlc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnBvc3QoJy8nKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2VuZChkYXRhQXJyYXkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZXQoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgIGV4cGVjdChyZXN1bHQuc3RhdHVzQ29kZSkudG9FcXVhbCg0MDApO1xuICAgICAgICBjb25zdCByZXMgPSByZXN1bHQuYm9keTtcbiAgICAgICAgZXhwZWN0KHJlcykudG9IYXZlUHJvcGVydHkoJ21lc3NhZ2UnKTtcbiAgICAgICAgZXhwZWN0KHJlcy5tZXNzYWdlKS50b0NvbnRhaW4oJ0ludmFsaWQgcmVxdWVzdCBib2R5Jyk7XG5cbiAgICB9KTtcblxuICAgIGl0KCdjYW5ub3QgaW5zZXJ0IGludm9pY2VzIHdpdGggZHVwbGljYXRlIGtleXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGludm9pY2UxTm8gPSAnVEVTVDEwMDQxJztcbiAgICAgICAgY29uc3QgaW52b2ljZTJObyA9ICdURVNUMTAwNDEnO1xuICAgICAgICBsZXQgZGF0YUFycmF5ID0gW107XG4gICAgICAgIGRhdGFBcnJheS5wdXNoKF8uY2xvbmVEZWVwKHRlbXBsYXRlSW52b2ljZSkpO1xuICAgICAgICBkYXRhQXJyYXkucHVzaChfLmNsb25lRGVlcCh0ZW1wbGF0ZUludm9pY2UpKTtcbiAgICAgICAgZGF0YUFycmF5WzBdLmtleSA9IGludm9pY2UxTm87XG4gICAgICAgIGRhdGFBcnJheVsxXS5rZXkgPSBpbnZvaWNlMk5vO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlcXVlc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnBvc3QoJy8nKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2VuZChkYXRhQXJyYXkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZXQoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgIGV4cGVjdChyZXN1bHQuc3RhdHVzQ29kZSkudG9FcXVhbCg0MDApO1xuICAgICAgICBjb25zdCByZXMgPSByZXN1bHQuYm9keTtcbiAgICAgICAgZXhwZWN0KHJlcykudG9IYXZlUHJvcGVydHkoJ21lc3NhZ2UnKTtcbiAgICAgICAgZXhwZWN0KHJlcy5tZXNzYWdlKS50b0NvbnRhaW4oJ0R1cGxpY2F0ZSBrZXknKTtcbiAgICB9KTtcbn0pO1xuXG5kZXNjcmliZSgnUmV0cmlldmUgaW52b2ljZXMnLCAoKSA9PiB7XG4gICAgaXQoJ2NhbiByZXRyaWV2ZSAxIGludm9pY2UnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlcXVlc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmdldCgnLycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5xdWVyeSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXlzOiAnVEVTVDEwMDAxJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2V0KCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICBleHBlY3QocmVzdWx0LnN0YXR1c0NvZGUpLnRvRXF1YWwoMjAwKTtcbiAgICAgICAgY29uc3QgcmVzID0gcmVzdWx0LmJvZHk7XG4gICAgICAgIGV4cGVjdCh0eXBlb2YgcmVzKS50b0VxdWFsKCdvYmplY3QnKTtcbiAgICAgICAgZXhwZWN0KHJlcykudG9IYXZlUHJvcGVydHkoJ3F1YW50aXR5Jyk7XG4gICAgICAgIGV4cGVjdChyZXMpLnRvSGF2ZVByb3BlcnR5KCdkYXRlJyk7XG4gICAgICAgIGV4cGVjdChyZXMpLnRvSGF2ZVByb3BlcnR5KCdiaWxsVG8nKTtcbiAgICAgICAgZXhwZWN0KHJlcykudG9IYXZlUHJvcGVydHkoJ2NhckluZm8nKTtcbiAgICB9KTtcblxuICAgIGl0KCdjYW4gcmV0cmlldmUgbXVsdGlwbGUgaW52b2ljZXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlcXVlc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmdldCgnLycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5xdWVyeSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXlzOiAnVEVTVDEwMDAxLFRFU1QxMDAxMidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldCgnQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgZXhwZWN0KHJlc3VsdC5zdGF0dXNDb2RlKS50b0VxdWFsKDIwMCk7XG4gICAgICAgIGNvbnN0IHJlcyA9IHJlc3VsdC5ib2R5O1xuICAgICAgICBleHBlY3QoQXJyYXkuaXNBcnJheShyZXMpKS50b0JlKHRydWUpO1xuICAgICAgICBleHBlY3QocmVzLmxlbmd0aCkudG9FcXVhbCgyKTtcbiAgICAgICAgcmVzLmZvckVhY2goKHI6IE9iamVjdCkgPT4ge1xuICAgICAgICAgICAgZXhwZWN0KHIpLnRvSGF2ZVByb3BlcnR5KCdxdWFudGl0eScpO1xuICAgICAgICAgICAgZXhwZWN0KHIpLnRvSGF2ZVByb3BlcnR5KCdkYXRlJyk7XG4gICAgICAgICAgICBleHBlY3QocikudG9IYXZlUHJvcGVydHkoJ2JpbGxUbycpO1xuICAgICAgICAgICAgZXhwZWN0KHIpLnRvSGF2ZVByb3BlcnR5KCdjYXJJbmZvJyk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ2Nhbm5vdCByZXRyaWV2ZSBtb3JlIHRoYW4gMzIgaW52b2ljZXMgYXQgdGhlIHNhbWUgdGltZScsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVxdWVzdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZ2V0KCcvJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnF1ZXJ5KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleXM6ICdURVNUMTAwMDEsVEVTVDEwMDEyLEEsQixDLEQsRSxGLEcsSCxJLEosSyxMLE0sTixPLFAsUSxSLFMsVCxVLFYsVyxYLFksWixBQSxBQixBQyxBRCxBRSxBRixBRydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldCgnQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgZXhwZWN0KHJlc3VsdC5zdGF0dXNDb2RlKS50b0VxdWFsKDQwMCk7XG4gICAgICAgIGNvbnN0IHJlcyA9IHJlc3VsdC5ib2R5O1xuICAgICAgICBleHBlY3QocmVzKS50b0hhdmVQcm9wZXJ0eSgnbWVzc2FnZScpO1xuICAgICAgICBleHBlY3QocmVzLm1lc3NhZ2UpLnRvQ29udGFpbignUmVxdWVzdGVkIHJlY29yZHMgZG8gbm90IGV4aXN0Jyk7XG5cbiAgICB9KTtcblxuICAgIGl0KCdjYW5ub3QgcmV0cmlldmUgaW52b2ljZXMgdGhhdCBkbyBub3QgZXhpc3QnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlcXVlc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmdldCgnLycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5xdWVyeSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXlzOiAnQSxCJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2V0KCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICBleHBlY3QocmVzdWx0LnN0YXR1c0NvZGUpLnRvRXF1YWwoNDAwKTtcbiAgICAgICAgY29uc3QgcmVzID0gcmVzdWx0LmJvZHk7XG4gICAgICAgIGV4cGVjdChyZXMpLnRvSGF2ZVByb3BlcnR5KCdtZXNzYWdlJyk7XG4gICAgICAgIGV4cGVjdChyZXMubWVzc2FnZSkudG9Db250YWluKCdSZXF1ZXN0ZWQgcmVjb3JkcyBkbyBub3QgZXhpc3QnKTtcbiAgICB9KTtcblxuICAgIGl0KCdjYW5ub3QgcmV0cmlldmUgaW52b2ljZXMgd2l0aG91dCBcImtleXNcIiBxdWVyeSBzdHJpbmcnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlcXVlc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmdldCgnLycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5xdWVyeSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk6ICdURVNUMTAwMDEnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZXQoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgIGV4cGVjdChyZXN1bHQuc3RhdHVzQ29kZSkudG9FcXVhbCg0MDApO1xuICAgICAgICBjb25zdCByZXMgPSByZXN1bHQuYm9keTtcbiAgICAgICAgZXhwZWN0KHJlcykudG9IYXZlUHJvcGVydHkoJ21lc3NhZ2UnKTtcbiAgICAgICAgZXhwZWN0KHJlcy5tZXNzYWdlKS50b0NvbnRhaW4oJ01pc3NpbmcgcmVxdWlyZWQgcmVxdWVzdCBwYXJhbWV0ZXJzJyk7XG4gICAgfSk7XG59KTtcblxuZGVzY3JpYmUoJ0dldCBpbnZvaWNlIG1ldGFkYXRhIGJ5IGtleScsICgpID0+IHtcbiAgICBpdCgnY2FuIGdldCAxIGludm9pY2UgbWV0YWRhdGEgYnkga2V5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByZXF1ZXN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5nZXQoJy9tZXRhZGF0YS1ieS1rZXknKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucXVlcnkoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5OiAnVEVTVDEwMDAxJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgZXhwZWN0KHJlc3VsdC5zdGF0dXNDb2RlKS50b0VxdWFsKDIwMCk7XG4gICAgICAgIGNvbnN0IHJlcyA9IHJlc3VsdC5ib2R5O1xuICAgICAgICBleHBlY3QodHlwZW9mIHJlcykudG9FcXVhbCgnb2JqZWN0Jyk7XG4gICAgICAgIGV4cGVjdChyZXMpLnRvSGF2ZVByb3BlcnR5KCdMZWRnZXJOYW1lJyk7XG4gICAgICAgIGV4cGVjdChyZXMpLnRvSGF2ZVByb3BlcnR5KCdUYWJsZU5hbWUnKTtcbiAgICAgICAgZXhwZWN0KHJlcykudG9IYXZlUHJvcGVydHkoJ0Jsb2NrQWRkcmVzcycpO1xuICAgICAgICBleHBlY3QocmVzKS50b0hhdmVQcm9wZXJ0eSgnRG9jdW1lbnRJZCcpO1xuICAgICAgICBleHBlY3QocmVzKS50b0hhdmVQcm9wZXJ0eSgnUmV2aXNpb25IYXNoJyk7XG4gICAgICAgIGV4cGVjdChyZXMpLnRvSGF2ZVByb3BlcnR5KCdQcm9vZicpO1xuICAgIH0pO1xuXG4gICAgaXQoJ2Nhbm5vdCBnZXQgaW52b2ljZSBtZXRhZGF0YSBmb3Iga2V5IHRoYXQgZG9lcyBub3QgZXhpc3QnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlcXVlc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmdldCgnL21ldGFkYXRhLWJ5LWtleScpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5xdWVyeSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk6ICdYWVonXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICBleHBlY3QocmVzdWx0LnN0YXR1c0NvZGUpLnRvRXF1YWwoNDAwKTtcbiAgICAgICAgY29uc3QgcmVzID0gcmVzdWx0LmJvZHk7XG4gICAgICAgIGV4cGVjdChyZXMpLnRvSGF2ZVByb3BlcnR5KCdtZXNzYWdlJyk7XG4gICAgICAgIGV4cGVjdChyZXMubWVzc2FnZSkudG9Db250YWluKCdDb3VsZCBub3QgZ2V0IG1ldGFkYXRhJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnY2Fubm90IHJldHJpZXZlIG1ldGFkYXRhIHdpdGhvdXQgXCJrZXlcIiBxdWVyeSBzdHJpbmcnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlcXVlc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmdldCgnL21ldGFkYXRhLWJ5LWtleScpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5xdWVyeSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb21lX290aGVyX2tleTogJ1RFU1QxMDAwMSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgZXhwZWN0KHJlc3VsdC5zdGF0dXNDb2RlKS50b0VxdWFsKDQwMCk7XG4gICAgICAgIGNvbnN0IHJlcyA9IHJlc3VsdC5ib2R5O1xuICAgICAgICBleHBlY3QocmVzKS50b0hhdmVQcm9wZXJ0eSgnbWVzc2FnZScpO1xuICAgICAgICBleHBlY3QocmVzLm1lc3NhZ2UpLnRvQ29udGFpbignTWlzc2luZyByZXF1aXJlZCByZXF1ZXN0IHBhcmFtZXRlcnMnKTtcbiAgICB9KTtcbn0pO1xuXG5kZXNjcmliZSgnR2V0IGludm9pY2UgbWV0YWRhdGEgYnkgZG9jSWQgYW5kIHR4SWQnLCAoKSA9PiB7XG4gICAgaXQoJ2NhbiBnZXQgMSBpbnZvaWNlIG1ldGFkYXRhIGJ5IGRvY0lkIGFuZCB0eElkJywgYXN5bmMgKCkgPT4ge1xuXG4gICAgICAgIGNvbnN0IGludm9pY2VObyA9ICdURVNUNDAwMDEnO1xuICAgICAgICBsZXQgZGF0YUFycmF5ID0gW107XG4gICAgICAgIGRhdGFBcnJheS5wdXNoKF8uY2xvbmVEZWVwKHRlbXBsYXRlSW52b2ljZSkpO1xuICAgICAgICBkYXRhQXJyYXlbMF0ua2V5ID0gaW52b2ljZU5vO1xuXG4gICAgICAgIGNvbnN0IGluZm8gPSBhd2FpdCByZXF1ZXN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5wb3N0KCcvJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNlbmQoZGF0YUFycmF5KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2V0KCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICBcbiAgICAgICAgZXhwZWN0KGluZm8uc3RhdHVzQ29kZSkudG9FcXVhbCgyMDApO1xuICAgICAgICBjb25zdCBkb2NJZCA9IGluZm8uYm9keS5kb2N1bWVudElkO1xuICAgICAgICBjb25zdCB0eElkID0gaW5mby5ib2R5LnR4SWQ7XG5cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVxdWVzdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZ2V0KCcvbWV0YWRhdGEtYnktZG9jJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnF1ZXJ5KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvY0lkOiBkb2NJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR4SWQ6IHR4SWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdChyZXN1bHQuc3RhdHVzQ29kZSkudG9FcXVhbCgyMDApO1xuICAgICAgICBjb25zdCByZXMgPSByZXN1bHQuYm9keTtcbiAgICAgICAgZXhwZWN0KHR5cGVvZiByZXMpLnRvRXF1YWwoJ29iamVjdCcpO1xuICAgICAgICBleHBlY3QocmVzKS50b0hhdmVQcm9wZXJ0eSgnTGVkZ2VyTmFtZScpO1xuICAgICAgICBleHBlY3QocmVzKS50b0hhdmVQcm9wZXJ0eSgnVGFibGVOYW1lJyk7XG4gICAgICAgIGV4cGVjdChyZXMpLnRvSGF2ZVByb3BlcnR5KCdCbG9ja0FkZHJlc3MnKTtcbiAgICAgICAgZXhwZWN0KHJlcykudG9IYXZlUHJvcGVydHkoJ0RvY3VtZW50SWQnKTtcbiAgICAgICAgZXhwZWN0KHJlcykudG9IYXZlUHJvcGVydHkoJ1JldmlzaW9uSGFzaCcpO1xuICAgICAgICBleHBlY3QocmVzKS50b0hhdmVQcm9wZXJ0eSgnUHJvb2YnKTtcbiAgICB9KTtcblxuICAgIGl0KCdjYW5ub3QgZ2V0IGludm9pY2UgbWV0YWRhdGEgZm9yIGRvY0lkIGFuZC9vciB0eElkIHRoYXQgZG8gbm90IGV4aXN0JywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByZXF1ZXN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5nZXQoJy9tZXRhZGF0YS1ieS1kb2MnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucXVlcnkoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9jSWQ6ICdBQkMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHhJZDogJ1hZWidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdChyZXN1bHQuc3RhdHVzQ29kZSkudG9FcXVhbCg0MDApO1xuICAgICAgICBjb25zdCByZXMgPSByZXN1bHQuYm9keTtcbiAgICAgICAgZXhwZWN0KHJlcykudG9IYXZlUHJvcGVydHkoJ21lc3NhZ2UnKTtcbiAgICAgICAgZXhwZWN0KHJlcy5tZXNzYWdlKS50b0NvbnRhaW4oJ0NvdWxkIG5vdCBnZXQgbWV0YWRhdGEnKTtcbiAgICB9KTtcblxuICAgIGl0KCdjYW5ub3QgcmV0cmlldmUgbWV0YWRhdGEgd2l0aG91dCBcImRvY0lkXCIgYW5kL29yIFwidHhJZFwiIHF1ZXJ5IHN0cmluZycsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVxdWVzdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZ2V0KCcvbWV0YWRhdGEtYnktZG9jJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnF1ZXJ5KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvbWVfb3RoZXJfa2V5OiAnVEVTVDEwMDAxJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICBleHBlY3QocmVzdWx0LnN0YXR1c0NvZGUpLnRvRXF1YWwoNDAwKTtcbiAgICAgICAgY29uc3QgcmVzID0gcmVzdWx0LmJvZHk7XG4gICAgICAgIGV4cGVjdChyZXMpLnRvSGF2ZVByb3BlcnR5KCdtZXNzYWdlJyk7XG4gICAgICAgIGV4cGVjdChyZXMubWVzc2FnZSkudG9Db250YWluKCdNaXNzaW5nIHJlcXVpcmVkIHJlcXVlc3QgcGFyYW1ldGVycycpO1xuICAgIH0pO1xufSk7XG5cbmRlc2NyaWJlKCdWZXJpZnkgaW52b2ljZSBtZXRhZGF0YScsICgpID0+IHtcbiAgICBsZXQgbWV0YWRhdGEgPSB7fTtcblxuICAgIGJlZm9yZUFsbChhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IHJlcXVlc3QuZ2V0KCcvbWV0YWRhdGEtYnkta2V5JylcbiAgICAgICAgLnF1ZXJ5KHtcbiAgICAgICAgICAga2V5OiAnVEVTVDEwMDAxJ1xuICAgICAgICB9KTtcbiAgICAgICAgZXhwZWN0KHJlcy5zdGF0dXNDb2RlKS50b0VxdWFsKDIwMCk7XG4gICAgICAgIG1ldGFkYXRhID0gcmVzLmJvZHk7XG4gICAgfSk7XG5cbiAgICBpdCgnY2FuIHZlcmlmeSAxIGludm9pY2UgbWV0YWRhdGEnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIFxuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCByZXF1ZXN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5wb3N0KCcvdmVyaWZ5JylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNlbmQoXy5jbG9uZURlZXAobWV0YWRhdGEpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2V0KCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICBleHBlY3QocmVzLnN0YXR1c0NvZGUpLnRvRXF1YWwoMjAwKTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gcmVzLmJvZHk7XG4gICAgICAgIGV4cGVjdCh0eXBlb2YgcmVzdWx0KS50b0VxdWFsKCdvYmplY3QnKTtcbiAgICAgICAgZXhwZWN0KHJlc3VsdCkudG9IYXZlUHJvcGVydHkoJ3Jlc3VsdCcpO1xuICAgIH0pO1xuXG4gICAgaXQoJ2Nhbm5vdCB2ZXJpZnkgaW52b2ljZSBtZXRhZGF0YSB3aXRoIGltcHJvcGVyIGZvcm1hdCcsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVxdWVzdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucG9zdCgnL3ZlcmlmeScpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZW5kKHt9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2V0KCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICBleHBlY3QocmVzdWx0LnN0YXR1c0NvZGUpLnRvRXF1YWwoNDAwKTtcbiAgICAgICAgY29uc3QgcmVzID0gcmVzdWx0LmJvZHk7XG4gICAgICAgIGV4cGVjdChyZXMpLnRvSGF2ZVByb3BlcnR5KCdtZXNzYWdlJyk7XG4gICAgICAgIGV4cGVjdChyZXMubWVzc2FnZSkudG9Db250YWluKCdJbnZhbGlkIHJlcXVlc3QgYm9keScpO1xuICAgIH0pO1xuXG4gICAgaXQoJ2Nhbm5vdCB2ZXJpZnkgaW52b2ljZSBtZXRhZGF0YSB3aXRoIGluY29ycmVjdCBibG9jayBhZGRyZXNzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBtID0gXy5jbG9uZURlZXAobWV0YWRhdGEpO1xuXG4gICAgICAgIG0uQmxvY2tBZGRyZXNzLklvblRleHQgPSBcIntzdHJhbmRJZDogXFxcImFiY2RlZmdoaWprbG1ub3Bxc3R1dndcXFwiLCBzZXF1ZW5jZU5vOiAzfVwiXG5cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVxdWVzdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucG9zdCgnL3ZlcmlmeScpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZW5kKG0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZXQoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgIGV4cGVjdChyZXN1bHQuc3RhdHVzQ29kZSkudG9FcXVhbCg0MDApO1xuICAgICAgICBjb25zdCByZXMgPSByZXN1bHQuYm9keTtcbiAgICAgICAgZXhwZWN0KHJlcykudG9IYXZlUHJvcGVydHkoJ21lc3NhZ2UnKTtcbiAgICAgICAgZXhwZWN0KHJlcy5tZXNzYWdlKS50b0NvbnRhaW4oJ0NvdWxkIG5vdCB2ZXJpZnkgdGhlIG1ldGFkdGEnKTtcbiAgICB9KTtcblxuICAgIGl0KCdjYW5ub3QgdmVyaWZ5IGludm9pY2UgbWV0YWRhdGEgd2l0aCBpbmNvcnJlY3QgZG9jdW1lbnRJZCcsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgbSA9IF8uY2xvbmVEZWVwKG1ldGFkYXRhKTtcblxuICAgICAgICBtLkRvY3VtZW50SWQgPSAnYWJjZGVmZ2hpamtsbW5vcHFzdHV2dyc7XG5cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVxdWVzdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucG9zdCgnL3ZlcmlmeScpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZW5kKG0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZXQoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgIGV4cGVjdChyZXN1bHQuc3RhdHVzQ29kZSkudG9FcXVhbCg0MDApO1xuICAgICAgICBjb25zdCByZXMgPSByZXN1bHQuYm9keTtcbiAgICAgICAgZXhwZWN0KHJlcykudG9IYXZlUHJvcGVydHkoJ21lc3NhZ2UnKTtcbiAgICAgICAgZXhwZWN0KHJlcy5tZXNzYWdlKS50b0NvbnRhaW4oJ0NvdWxkIG5vdCB2ZXJpZnkgdGhlIG1ldGFkdGEnKTtcbiAgICB9KTtcblxuICAgIGl0KCdjYW5ub3QgdmVyaWZ5IGludm9pY2UgbWV0YWRhdGEgd2l0aCBpbmNvcnJlY3QgZG9jdW1lbnRJZCBsZW5ndGggKG5vdCAyMiBjaGFyYWN0ZXJzKScsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgbSA9IF8uY2xvbmVEZWVwKG1ldGFkYXRhKTtcblxuICAgICAgICBtLkRvY3VtZW50SWQgPSAnWFlaJztcblxuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByZXF1ZXN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5wb3N0KCcvdmVyaWZ5JylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNlbmQobSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldCgnQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgZXhwZWN0KHJlc3VsdC5zdGF0dXNDb2RlKS50b0VxdWFsKDQwMCk7XG4gICAgICAgIGNvbnN0IHJlcyA9IHJlc3VsdC5ib2R5O1xuICAgICAgICBleHBlY3QocmVzKS50b0hhdmVQcm9wZXJ0eSgnbWVzc2FnZScpO1xuICAgICAgICBleHBlY3QocmVzLm1lc3NhZ2UpLnRvQ29udGFpbignSW52YWxpZCByZXF1ZXN0IGJvZHknKTtcbiAgICB9KTtcblxuICAgIGl0KCdjYW5ub3QgdmVyaWZ5IGludm9pY2UgbWV0YWRhdGEgd2l0aCBpbmNvcnJlY3QgcmV2aXNpb24gaGFzaCcsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgbSA9IF8uY2xvbmVEZWVwKG1ldGFkYXRhKTtcblxuICAgICAgICBtLlJldmlzaW9uSGFzaCA9ICdhYmNkZWZnaGlqa2xtbm9wcXN0dXZ3JztcblxuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByZXF1ZXN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5wb3N0KCcvdmVyaWZ5JylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNlbmQobSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldCgnQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgZXhwZWN0KHJlc3VsdC5zdGF0dXNDb2RlKS50b0VxdWFsKDQwMCk7XG4gICAgICAgIGNvbnN0IHJlcyA9IHJlc3VsdC5ib2R5O1xuICAgICAgICBleHBlY3QocmVzKS50b0hhdmVQcm9wZXJ0eSgnbWVzc2FnZScpO1xuICAgICAgICBleHBlY3QocmVzLm1lc3NhZ2UpLnRvQ29udGFpbignQ291bGQgbm90IHZlcmlmeSB0aGUgbWV0YWR0YScpO1xuICAgIH0pO1xuXG4gICAgaXQoJ2Nhbm5vdCB2ZXJpZnkgaW52b2ljZSBtZXRhZGF0YSB3aXRoIGluY29ycmVjdCBsZWRnZXIgZGlnZXN0JywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBtID0gXy5jbG9uZURlZXAobWV0YWRhdGEpO1xuXG4gICAgICAgIG0uTGVkZ2VyRGlnZXN0LkRpZ2VzdCA9ICdhYmNkZWZnaGlqa2xtbm9wcXN0dXZ3JztcblxuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByZXF1ZXN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5wb3N0KCcvdmVyaWZ5JylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNlbmQobSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldCgnQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgZXhwZWN0KHJlc3VsdC5zdGF0dXNDb2RlKS50b0VxdWFsKDQwMCk7XG4gICAgICAgIGNvbnN0IHJlcyA9IHJlc3VsdC5ib2R5O1xuICAgICAgICBleHBlY3QocmVzKS50b0hhdmVQcm9wZXJ0eSgnbWVzc2FnZScpO1xuICAgICAgICBleHBlY3QocmVzLm1lc3NhZ2UpLnRvQ29udGFpbignQ291bGQgbm90IHZlcmlmeSB0aGUgbWV0YWR0YScpO1xuICAgIH0pO1xuXG4gICAgaXQoJ2Nhbm5vdCB2ZXJpZnkgaW52b2ljZSBtZXRhZGF0YSB3aXRoIGluY29ycmVjdCBkaWdlc3QgdGlwIGFkZHJlc3MnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IG0gPSBfLmNsb25lRGVlcChtZXRhZGF0YSk7XG5cbiAgICAgICAgbS5MZWRnZXJEaWdlc3QuRGlnZXN0VGlwQWRkcmVzcy5Jb25UZXh0ID0gXCJ7c3RyYW5kSWQ6IFxcXCJhYmNkZWZnaGlqa2xtbm9wcXN0dXZ3XFxcIiwgc2VxdWVuY2VObzogOH1cIlxuXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlcXVlc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnBvc3QoJy92ZXJpZnknKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2VuZChtKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2V0KCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICBleHBlY3QocmVzdWx0LnN0YXR1c0NvZGUpLnRvRXF1YWwoNDAwKTtcbiAgICAgICAgY29uc3QgcmVzID0gcmVzdWx0LmJvZHk7XG4gICAgICAgIGV4cGVjdChyZXMpLnRvSGF2ZVByb3BlcnR5KCdtZXNzYWdlJyk7XG4gICAgICAgIGV4cGVjdChyZXMubWVzc2FnZSkudG9Db250YWluKCdDb3VsZCBub3QgdmVyaWZ5IHRoZSBtZXRhZHRhJyk7XG4gICAgfSk7XG5cbn0pO1xuXG5kZXNjcmliZSgnR2V0IGRvY3VtZW50IHJldmlzaW9uIGJ5IG1ldGFkYXRhJywgKCkgPT4ge1xuICAgIGxldCBtZXRhZGF0YSA9IHt9O1xuXG4gICAgYmVmb3JlQWxsKGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgcmVxdWVzdC5nZXQoJy9tZXRhZGF0YS1ieS1rZXknKVxuICAgICAgICAucXVlcnkoe1xuICAgICAgICAgICBrZXk6ICdURVNUMTAwMDEnXG4gICAgICAgIH0pO1xuICAgICAgICBleHBlY3QocmVzLnN0YXR1c0NvZGUpLnRvRXF1YWwoMjAwKTtcbiAgICAgICAgbWV0YWRhdGEgPSByZXMuYm9keTtcbiAgICB9KTtcblxuICAgIGl0KCdjYW4gcmV0cmlldmUgMSBkb2N1bWVudCByZXZpc2lvbiBieSBtZXRhZGF0YScsIGFzeW5jICgpID0+IHtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IHJlcXVlc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnBvc3QoJy9yZXZpc2lvbicpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZW5kKF8uY2xvbmVEZWVwKG1ldGFkYXRhKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldCgnQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgZXhwZWN0KHJlcy5zdGF0dXNDb2RlKS50b0VxdWFsKDIwMCk7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHJlcy5ib2R5O1xuICAgICAgICBleHBlY3QodHlwZW9mIHJlc3VsdCkudG9FcXVhbCgnb2JqZWN0Jyk7XG4gICAgICAgIGV4cGVjdChyZXN1bHQpLnRvSGF2ZVByb3BlcnR5KCdQcm9vZicpO1xuICAgICAgICBleHBlY3QocmVzdWx0KS50b0hhdmVQcm9wZXJ0eSgnUmV2aXNpb24nKTtcbiAgICB9KTtcblxuICAgIGl0KCdjYW5ub3QgcmV0cmlldmUgZG9jdW1lbnQgcmV2aXNpb24gd2l0aCBpbXByb3BlciBmb3JtYXQnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlcXVlc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnBvc3QoJy9yZXZpc2lvbicpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZW5kKHt9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2V0KCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICBleHBlY3QocmVzdWx0LnN0YXR1c0NvZGUpLnRvRXF1YWwoNDAwKTtcbiAgICAgICAgY29uc3QgcmVzID0gcmVzdWx0LmJvZHk7XG4gICAgICAgIGV4cGVjdChyZXMpLnRvSGF2ZVByb3BlcnR5KCdtZXNzYWdlJyk7XG4gICAgICAgIGV4cGVjdChyZXMubWVzc2FnZSkudG9Db250YWluKCdJbnZhbGlkIHJlcXVlc3QgYm9keScpO1xuICAgIH0pO1xuXG4gICAgaXQoJ2Nhbm5vdCByZXRyaWV2ZSBkb2N1bWVudCByZXZpc2lvbiB3aXRoIGluY29ycmVjdCBibG9jayBhZGRyZXNzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBtID0gXy5jbG9uZURlZXAobWV0YWRhdGEpO1xuXG4gICAgICAgIG0uQmxvY2tBZGRyZXNzLklvblRleHQgPSBcIntzdHJhbmRJZDogXFxcImFiY2RlZmdoaWprbG1ub3Bxc3R1dndcXFwiLCBzZXF1ZW5jZU5vOiAzfVwiXG5cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVxdWVzdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucG9zdCgnL3JldmlzaW9uJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNlbmQobSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldCgnQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgZXhwZWN0KHJlc3VsdC5zdGF0dXNDb2RlKS50b0VxdWFsKDQwMCk7XG4gICAgICAgIGNvbnN0IHJlcyA9IHJlc3VsdC5ib2R5O1xuICAgICAgICBleHBlY3QocmVzKS50b0hhdmVQcm9wZXJ0eSgnbWVzc2FnZScpO1xuICAgICAgICBleHBlY3QocmVzLm1lc3NhZ2UpLnRvQ29udGFpbignQ291bGQgbm90IGdldCBkb2N1bWVudCByZXZpc2lvbicpO1xuICAgIH0pO1xuXG4gICAgaXQoJ2Nhbm5vdCByZXRyaWV2ZSBkb2N1bWVudCByZXZpc2lvbiB3aXRoIGluY29ycmVjdCBkb2N1bWVudElkJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBtID0gXy5jbG9uZURlZXAobWV0YWRhdGEpO1xuXG4gICAgICAgIG0uRG9jdW1lbnRJZCA9ICdhYmNkZWZnaGlqa2xtbm9wcXN0dXZ3JztcblxuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByZXF1ZXN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5wb3N0KCcvcmV2aXNpb24nKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2VuZChtKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2V0KCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICBleHBlY3QocmVzdWx0LnN0YXR1c0NvZGUpLnRvRXF1YWwoNDAwKTtcbiAgICAgICAgY29uc3QgcmVzID0gcmVzdWx0LmJvZHk7XG4gICAgICAgIGV4cGVjdChyZXMpLnRvSGF2ZVByb3BlcnR5KCdtZXNzYWdlJyk7XG4gICAgICAgIGV4cGVjdChyZXMubWVzc2FnZSkudG9Db250YWluKCdDb3VsZCBub3QgZ2V0IGRvY3VtZW50IHJldmlzaW9uJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnY2Fubm90IHJldHJpZXZlIGRvY3VtZW50IHJldmlzaW9uIHdpdGggaW5jb3JyZWN0IGRvY3VtZW50SWQgbGVuZ3RoIChub3QgMjIgY2hhcmFjdGVycyknLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IG0gPSBfLmNsb25lRGVlcChtZXRhZGF0YSk7XG5cbiAgICAgICAgbS5Eb2N1bWVudElkID0gJ1hZWic7XG5cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVxdWVzdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucG9zdCgnL3JldmlzaW9uJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNlbmQobSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldCgnQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgZXhwZWN0KHJlc3VsdC5zdGF0dXNDb2RlKS50b0VxdWFsKDQwMCk7XG4gICAgICAgIGNvbnN0IHJlcyA9IHJlc3VsdC5ib2R5O1xuICAgICAgICBleHBlY3QocmVzKS50b0hhdmVQcm9wZXJ0eSgnbWVzc2FnZScpO1xuICAgICAgICBleHBlY3QocmVzLm1lc3NhZ2UpLnRvQ29udGFpbignSW52YWxpZCByZXF1ZXN0IGJvZHknKTtcbiAgICB9KTtcblxuICAgIGl0KCdjYW5ub3QgcmV0cmlldmUgZG9jdW1lbnQgcmV2aXNpb24gd2l0aCBpbmNvcnJlY3QgZGlnZXN0IHRpcCBhZGRyZXNzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBtID0gXy5jbG9uZURlZXAobWV0YWRhdGEpO1xuXG4gICAgICAgIG0uTGVkZ2VyRGlnZXN0LkRpZ2VzdFRpcEFkZHJlc3MuSW9uVGV4dCA9IFwie3N0cmFuZElkOiBcXFwiYWJjZGVmZ2hpamtsbW5vcHFzdHV2d1xcXCIsIHNlcXVlbmNlTm86IDh9XCJcblxuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByZXF1ZXN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5wb3N0KCcvcmV2aXNpb24nKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2VuZChtKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2V0KCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICBleHBlY3QocmVzdWx0LnN0YXR1c0NvZGUpLnRvRXF1YWwoNDAwKTtcbiAgICAgICAgY29uc3QgcmVzID0gcmVzdWx0LmJvZHk7XG4gICAgICAgIGV4cGVjdChyZXMpLnRvSGF2ZVByb3BlcnR5KCdtZXNzYWdlJyk7XG4gICAgICAgIGV4cGVjdChyZXMubWVzc2FnZSkudG9Db250YWluKCdDb3VsZCBub3QgZ2V0IGRvY3VtZW50IHJldmlzaW9uJyk7XG4gICAgfSk7XG5cbn0pO1xuXG5kZXNjcmliZSgnUmV0cmlldmUgaW52b2ljZSBoaXN0b3J5JywgKCkgPT4ge1xuICAgIGl0KCdjYW4gcmV0cmlldmUgMSBpbnZvaWNlIGhpc3RvcnknLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlcXVlc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmdldCgnL2hpc3RvcnknKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucXVlcnkoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5OiAnVEVTVDEwMDAxJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICBleHBlY3QocmVzdWx0LnN0YXR1c0NvZGUpLnRvRXF1YWwoMjAwKTtcbiAgICAgICAgY29uc3QgcmVzID0gcmVzdWx0LmJvZHk7XG4gICAgICAgIGV4cGVjdChBcnJheS5pc0FycmF5KHJlcykpLnRvQmUodHJ1ZSk7XG4gICAgICAgIHJlcy5mb3JFYWNoKChyOiBPYmplY3QpID0+IHtcbiAgICAgICAgICAgIGV4cGVjdChyKS50b0hhdmVQcm9wZXJ0eSgnYmxvY2tBZGRyZXNzJyk7XG4gICAgICAgICAgICBleHBlY3QocikudG9IYXZlUHJvcGVydHkoJ2hhc2gnKTtcbiAgICAgICAgICAgIGV4cGVjdChyKS50b0hhdmVQcm9wZXJ0eSgnZGF0YScpO1xuICAgICAgICAgICAgZXhwZWN0KHIpLnRvSGF2ZVByb3BlcnR5KCdtZXRhZGF0YScpO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdjYW5ub3QgcmV0cmlldmUgaGlzdG9yeSBmb3IgaW52b2ljZSB0aGF0IGRvIG5vdCBleGlzdCcsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVxdWVzdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZ2V0KCcvaGlzdG9yeScpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5xdWVyeSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk6ICdBJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICBleHBlY3QocmVzdWx0LnN0YXR1c0NvZGUpLnRvRXF1YWwoNDAwKTtcbiAgICAgICAgY29uc3QgcmVzID0gcmVzdWx0LmJvZHk7XG4gICAgICAgIGV4cGVjdChyZXMpLnRvSGF2ZVByb3BlcnR5KCdtZXNzYWdlJyk7XG4gICAgICAgIGV4cGVjdChyZXMubWVzc2FnZSkudG9Db250YWluKCdDb3VsZCBub3QgZ2V0IGhpc3RvcnknKTtcbiAgICB9KTtcblxuICAgIGl0KCdjYW5ub3QgcmV0cmlldmUgaW52b2ljZXMgd2l0aG91dCBcImtleVwiIHF1ZXJ5IHN0cmluZycsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVxdWVzdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZ2V0KCcvaGlzdG9yeScpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5xdWVyeSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXlzOiAnVEVTVDEwMDAxJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICBleHBlY3QocmVzdWx0LnN0YXR1c0NvZGUpLnRvRXF1YWwoNDAwKTtcbiAgICAgICAgY29uc3QgcmVzID0gcmVzdWx0LmJvZHk7XG4gICAgICAgIGV4cGVjdChyZXMpLnRvSGF2ZVByb3BlcnR5KCdtZXNzYWdlJyk7XG4gICAgICAgIGV4cGVjdChyZXMubWVzc2FnZSkudG9Db250YWluKCdNaXNzaW5nIHJlcXVpcmVkIHJlcXVlc3QgcGFyYW1ldGVycycpO1xuICAgIH0pO1xufSk7Il19