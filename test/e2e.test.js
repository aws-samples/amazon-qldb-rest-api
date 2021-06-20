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
        expect(res.message).toContain('Requested documents do not exist');
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
        expect(res.message).toContain('Requested documents do not exist');
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
describe('Get invoice receipt by key', () => {
    it('can get 1 invoice receipt by key', async () => {
        const result = await request
            .get('/receipt-by-key')
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
    it('cannot get invoice receipt for key that does not exist', async () => {
        const result = await request
            .get('/receipt-by-key')
            .query({
            key: 'XYZ'
        });
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Could not get metadata');
    });
    it('cannot retrieve receipt without "key" query string', async () => {
        const result = await request
            .get('/receipt-by-key')
            .query({
            some_other_key: 'TEST10001'
        });
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Missing required request parameters');
    });
});
describe('Get invoice receipt by documentId and txId', () => {
    it('can get 1 invoice receipt by documentId and txId', async () => {
        const invoiceNo = 'TEST40001';
        let dataArray = [];
        dataArray.push(_.cloneDeep(templateInvoice));
        dataArray[0].key = invoiceNo;
        const info = await request
            .post('/')
            .send(dataArray)
            .set('Content-Type', 'application/json');
        expect(info.statusCode).toEqual(200);
        const documentId = info.body.documentId;
        const txId = info.body.txId;
        const result = await request
            .get('/receipt-by-doc')
            .query({
            documentId: documentId,
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
    it('cannot get invoice receipt for documentId and/or txId that do not exist', async () => {
        const result = await request
            .get('/receipt-by-doc')
            .query({
            documentId: 'ABC',
            txId: 'XYZ'
        });
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Could not get metadata');
    });
    it('cannot retrieve receipt without "documentId" and/or "txId" query string', async () => {
        const result = await request
            .get('/receipt-by-doc')
            .query({
            some_other_key: 'TEST10001'
        });
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Missing required request parameters');
    });
});
describe('Verify invoice receipt', () => {
    let receipt = {};
    beforeAll(async () => {
        const res = await request.get('/receipt-by-key')
            .query({
            key: 'TEST10001'
        });
        expect(res.statusCode).toEqual(200);
        receipt = res.body;
    });
    it('can verify 1 invoice receipt', async () => {
        const res = await request
            .post('/verify-receipt')
            .send(_.cloneDeep(receipt))
            .set('Content-Type', 'application/json');
        expect(res.statusCode).toEqual(200);
        const result = res.body;
        expect(typeof result).toEqual('object');
        expect(result).toHaveProperty('result');
    });
    it('cannot verify invoice receipt with improper format', async () => {
        const result = await request
            .post('/verify-receipt')
            .send({})
            .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Invalid request body');
    });
    it('cannot verify invoice receipt with incorrect block address', async () => {
        const m = _.cloneDeep(receipt);
        m.BlockAddress.IonText = "{strandId: \"abcdefghijklmnopqstuvw\", sequenceNo: 3}";
        const result = await request
            .post('/verify-receipt')
            .send(m)
            .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Could not verify the metadta');
    });
    it('cannot verify invoice receipt with incorrect documentId', async () => {
        const m = _.cloneDeep(receipt);
        m.DocumentId = 'abcdefghijklmnopqstuvw';
        const result = await request
            .post('/verify-receipt')
            .send(m)
            .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Could not verify the metadta');
    });
    it('cannot verify invoice receipt with incorrect documentId length (not 22 characters)', async () => {
        const m = _.cloneDeep(receipt);
        m.DocumentId = 'XYZ';
        const result = await request
            .post('/verify-receipt')
            .send(m)
            .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Invalid request body');
    });
    it('cannot verify invoice receipt with incorrect revision hash', async () => {
        const m = _.cloneDeep(receipt);
        m.RevisionHash = 'abcdefghijklmnopqstuvw';
        const result = await request
            .post('/verify-receipt')
            .send(m)
            .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Could not verify the metadta');
    });
    it('cannot verify invoice receipt with incorrect ledger digest', async () => {
        const m = _.cloneDeep(receipt);
        m.LedgerDigest.Digest = 'abcdefghijklmnopqstuvw';
        const result = await request
            .post('/verify-receipt')
            .send(m)
            .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Could not verify the metadta');
    });
    it('cannot verify invoice receipt with incorrect digest tip address', async () => {
        const m = _.cloneDeep(receipt);
        m.LedgerDigest.DigestTipAddress.IonText = "{strandId: \"abcdefghijklmnopqstuvw\", sequenceNo: 8}";
        const result = await request
            .post('/verify-receipt')
            .send(m)
            .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Could not verify the metadta');
    });
});
describe('Get document revision by receipt', () => {
    let receipt = {};
    beforeAll(async () => {
        const res = await request.get('/receipt-by-key')
            .query({
            key: 'TEST10001'
        });
        expect(res.statusCode).toEqual(200);
        receipt = res.body;
    });
    it('can retrieve 1 document revision by receipt', async () => {
        const res = await request
            .post('/revision')
            .send(_.cloneDeep(receipt))
            .set('Content-Type', 'application/json');
        expect(res.statusCode).toEqual(200);
        const result = res.body;
        expect(typeof result).toEqual('object');
        expect(result).toHaveProperty('data');
        expect(result).toHaveProperty('metadata');
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
        const m = _.cloneDeep(receipt);
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
        const m = _.cloneDeep(receipt);
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
        const m = _.cloneDeep(receipt);
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
        const m = _.cloneDeep(receipt);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZTJlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJlMmUudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsTUFBTSxjQUFjLEdBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUM7QUFDakQsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ3JELE1BQU0sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUM1QixNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7QUFFN0IsTUFBTSxlQUFlLEdBQUc7SUFDcEIsS0FBSyxFQUFFLGNBQWM7SUFDckIsT0FBTyxFQUFFO1FBQ0wsTUFBTSxFQUFFLFlBQVk7UUFDcEIsUUFBUSxFQUFFLHdCQUF3QjtRQUNsQyxlQUFlLEVBQUUsU0FBUztRQUMxQixTQUFTLEVBQUU7WUFDUCxPQUFPLEVBQUUsT0FBTztZQUNoQixNQUFNLEVBQUUsTUFBTTtZQUNkLE1BQU0sRUFBRSxJQUFJO1lBQ1osV0FBVyxFQUFFLEtBQUs7U0FDckI7UUFDRCxVQUFVLEVBQUUsRUFBRTtLQUNqQjtDQUNKLENBQUE7QUFFRCxRQUFRLENBQUMsb0JBQW9CLEVBQUUsR0FBRyxFQUFFO0lBQ2hDLEVBQUUsQ0FBQyxzQkFBc0IsRUFBRSxLQUFLLElBQUksRUFBRTtRQUNsQyxNQUFNLFNBQVMsR0FBRyxXQUFXLENBQUM7UUFDOUIsSUFBSSxTQUFTLEdBQUcsRUFBRSxDQUFDO1FBQ25CLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1FBQzdDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsU0FBUyxDQUFDO1FBRTdCLE1BQU0sTUFBTSxHQUFHLE1BQU0sT0FBTzthQUNILElBQUksQ0FBQyxHQUFHLENBQUM7YUFDVCxJQUFJLENBQUMsU0FBUyxDQUFDO2FBQ2YsR0FBRyxDQUFDLGNBQWMsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1FBQ2pFLE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZDLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDeEIsTUFBTSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3JDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDekMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN2QyxDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyx1QkFBdUIsRUFBRSxLQUFLLElBQUksRUFBRTtRQUNuQyxNQUFNLFVBQVUsR0FBRyxXQUFXLENBQUM7UUFDL0IsTUFBTSxVQUFVLEdBQUcsV0FBVyxDQUFDO1FBQy9CLElBQUksU0FBUyxHQUFHLEVBQUUsQ0FBQztRQUNuQixTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztRQUM3QyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztRQUM3QyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLFVBQVUsQ0FBQztRQUM5QixTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLFVBQVUsQ0FBQztRQUU5QixNQUFNLE1BQU0sR0FBRyxNQUFNLE9BQU87YUFDSCxJQUFJLENBQUMsR0FBRyxDQUFDO2FBQ1QsSUFBSSxDQUFDLFNBQVMsQ0FBQzthQUNmLEdBQUcsQ0FBQyxjQUFjLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztRQUNqRSxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN2QyxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ3hCLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3RDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFTLEVBQUUsRUFBRTtZQUN0QixNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ3ZDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDckMsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyx5QkFBeUIsRUFBRSxLQUFLLElBQUksRUFBRTtRQUNyQyxNQUFNLE1BQU0sR0FBRyxNQUFNLE9BQU87YUFDSCxJQUFJLENBQUMsR0FBRyxDQUFDO2FBQ1QsSUFBSSxDQUFDLEVBQUUsQ0FBQzthQUNSLEdBQUcsQ0FBQyxjQUFjLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztRQUNqRSxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN2QyxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ3hCLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDdEMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxTQUFTLENBQUMsc0JBQXNCLENBQUMsQ0FBQztJQUMxRCxDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyxxQ0FBcUMsRUFBRSxLQUFLLElBQUksRUFBRTtRQUNqRCxJQUFJLFNBQVMsR0FBRyxFQUFFLENBQUM7UUFDbkIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUN6QixNQUFNLFNBQVMsR0FBRyxXQUFXLENBQUMsRUFBRSxDQUFDO1lBQ2pDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1lBQzdDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsU0FBUyxDQUFDO1NBQ2hDO1FBQ0QsTUFBTSxNQUFNLEdBQUcsTUFBTSxPQUFPO2FBQ0gsSUFBSSxDQUFDLEdBQUcsQ0FBQzthQUNULElBQUksQ0FBQyxTQUFTLENBQUM7YUFDZixHQUFHLENBQUMsY0FBYyxFQUFFLGtCQUFrQixDQUFDLENBQUM7UUFDakUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdkMsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQztRQUN4QixNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3RDLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsU0FBUyxDQUFDLHNCQUFzQixDQUFDLENBQUM7SUFDMUQsQ0FBQyxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMsNENBQTRDLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDeEQsSUFBSSxTQUFTLEdBQUcsRUFBRSxDQUFDO1FBQ25CLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1FBQzdDLE1BQU0sU0FBUyxHQUFHLFdBQVcsQ0FBQztRQUM5QixTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLFNBQVMsQ0FBQztRQUM3QixPQUFPLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDO1FBRWpDLE1BQU0sTUFBTSxHQUFHLE1BQU0sT0FBTzthQUNILElBQUksQ0FBQyxHQUFHLENBQUM7YUFDVCxJQUFJLENBQUMsU0FBUyxDQUFDO2FBQ2YsR0FBRyxDQUFDLGNBQWMsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1FBQ2pFLE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZDLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDeEIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN0QyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFNBQVMsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO0lBRTFELENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLDRDQUE0QyxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ3hELE1BQU0sVUFBVSxHQUFHLFdBQVcsQ0FBQztRQUMvQixNQUFNLFVBQVUsR0FBRyxXQUFXLENBQUM7UUFDL0IsSUFBSSxTQUFTLEdBQUcsRUFBRSxDQUFDO1FBQ25CLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1FBQzdDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1FBQzdDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsVUFBVSxDQUFDO1FBQzlCLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsVUFBVSxDQUFDO1FBRTlCLE1BQU0sTUFBTSxHQUFHLE1BQU0sT0FBTzthQUNILElBQUksQ0FBQyxHQUFHLENBQUM7YUFDVCxJQUFJLENBQUMsU0FBUyxDQUFDO2FBQ2YsR0FBRyxDQUFDLGNBQWMsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1FBQ2pFLE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZDLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDeEIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN0QyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUNuRCxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUMsQ0FBQyxDQUFDO0FBRUgsUUFBUSxDQUFDLG1CQUFtQixFQUFFLEdBQUcsRUFBRTtJQUMvQixFQUFFLENBQUMsd0JBQXdCLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDcEMsTUFBTSxNQUFNLEdBQUcsTUFBTSxPQUFPO2FBQ0gsR0FBRyxDQUFDLEdBQUcsQ0FBQzthQUNSLEtBQUssQ0FBQztZQUNILElBQUksRUFBRSxXQUFXO1NBQ3BCLENBQUM7YUFDRCxHQUFHLENBQUMsY0FBYyxFQUFFLGtCQUFrQixDQUFDLENBQUM7UUFDakUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdkMsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQztRQUN4QixNQUFNLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDckMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUN2QyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ25DLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDckMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUMxQyxDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyxnQ0FBZ0MsRUFBRSxLQUFLLElBQUksRUFBRTtRQUM1QyxNQUFNLE1BQU0sR0FBRyxNQUFNLE9BQU87YUFDSCxHQUFHLENBQUMsR0FBRyxDQUFDO2FBQ1IsS0FBSyxDQUFDO1lBQ0gsSUFBSSxFQUFFLHFCQUFxQjtTQUM5QixDQUFDO2FBQ0QsR0FBRyxDQUFDLGNBQWMsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1FBQ2pFLE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZDLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDeEIsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdEMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDOUIsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQVMsRUFBRSxFQUFFO1lBQ3RCLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDckMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNqQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ25DLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDeEMsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyx3REFBd0QsRUFBRSxLQUFLLElBQUksRUFBRTtRQUNwRSxNQUFNLE1BQU0sR0FBRyxNQUFNLE9BQU87YUFDSCxHQUFHLENBQUMsR0FBRyxDQUFDO2FBQ1IsS0FBSyxDQUFDO1lBQ0gsSUFBSSxFQUFFLDhGQUE4RjtTQUN2RyxDQUFDO2FBQ0QsR0FBRyxDQUFDLGNBQWMsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1FBQ2pFLE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZDLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDeEIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN0QyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFNBQVMsQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDO0lBRXRFLENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLDRDQUE0QyxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ3hELE1BQU0sTUFBTSxHQUFHLE1BQU0sT0FBTzthQUNILEdBQUcsQ0FBQyxHQUFHLENBQUM7YUFDUixLQUFLLENBQUM7WUFDSCxJQUFJLEVBQUUsS0FBSztTQUNkLENBQUM7YUFDRCxHQUFHLENBQUMsY0FBYyxFQUFFLGtCQUFrQixDQUFDLENBQUM7UUFDakUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdkMsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQztRQUN4QixNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3RDLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsU0FBUyxDQUFDLGtDQUFrQyxDQUFDLENBQUM7SUFDdEUsQ0FBQyxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMsc0RBQXNELEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDbEUsTUFBTSxNQUFNLEdBQUcsTUFBTSxPQUFPO2FBQ0gsR0FBRyxDQUFDLEdBQUcsQ0FBQzthQUNSLEtBQUssQ0FBQztZQUNILEdBQUcsRUFBRSxXQUFXO1NBQ25CLENBQUM7YUFDRCxHQUFHLENBQUMsY0FBYyxFQUFFLGtCQUFrQixDQUFDLENBQUM7UUFDakUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdkMsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQztRQUN4QixNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3RDLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsU0FBUyxDQUFDLHFDQUFxQyxDQUFDLENBQUM7SUFDekUsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDLENBQUMsQ0FBQztBQUVILFFBQVEsQ0FBQyw0QkFBNEIsRUFBRSxHQUFHLEVBQUU7SUFDeEMsRUFBRSxDQUFDLGtDQUFrQyxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQzlDLE1BQU0sTUFBTSxHQUFHLE1BQU0sT0FBTzthQUNILEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQzthQUN0QixLQUFLLENBQUM7WUFDSCxHQUFHLEVBQUUsV0FBVztTQUNuQixDQUFDLENBQUM7UUFDM0IsTUFBTSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdkMsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQztRQUN4QixNQUFNLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDckMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUN6QyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsY0FBYyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3hDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxjQUFjLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDM0MsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUN6QyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsY0FBYyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQzNDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDeEMsQ0FBQyxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMsd0RBQXdELEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDcEUsTUFBTSxNQUFNLEdBQUcsTUFBTSxPQUFPO2FBQ0gsR0FBRyxDQUFDLGlCQUFpQixDQUFDO2FBQ3RCLEtBQUssQ0FBQztZQUNILEdBQUcsRUFBRSxLQUFLO1NBQ2IsQ0FBQyxDQUFDO1FBQzNCLE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZDLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDeEIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN0QyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFNBQVMsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO0lBQzVELENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLG9EQUFvRCxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ2hFLE1BQU0sTUFBTSxHQUFHLE1BQU0sT0FBTzthQUNILEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQzthQUN0QixLQUFLLENBQUM7WUFDSCxjQUFjLEVBQUUsV0FBVztTQUM5QixDQUFDLENBQUE7UUFDMUIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdkMsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQztRQUN4QixNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3RDLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsU0FBUyxDQUFDLHFDQUFxQyxDQUFDLENBQUM7SUFDekUsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDLENBQUMsQ0FBQztBQUVILFFBQVEsQ0FBQyw0Q0FBNEMsRUFBRSxHQUFHLEVBQUU7SUFDeEQsRUFBRSxDQUFDLGtEQUFrRCxFQUFFLEtBQUssSUFBSSxFQUFFO1FBRTlELE1BQU0sU0FBUyxHQUFHLFdBQVcsQ0FBQztRQUM5QixJQUFJLFNBQVMsR0FBRyxFQUFFLENBQUM7UUFDbkIsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7UUFDN0MsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxTQUFTLENBQUM7UUFFN0IsTUFBTSxJQUFJLEdBQUcsTUFBTSxPQUFPO2FBQ0QsSUFBSSxDQUFDLEdBQUcsQ0FBQzthQUNULElBQUksQ0FBQyxTQUFTLENBQUM7YUFDZixHQUFHLENBQUMsY0FBYyxFQUFFLGtCQUFrQixDQUFDLENBQUM7UUFFakUsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDckMsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7UUFDeEMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7UUFFNUIsTUFBTSxNQUFNLEdBQUcsTUFBTSxPQUFPO2FBQ0gsR0FBRyxDQUFDLGlCQUFpQixDQUFDO2FBQ3RCLEtBQUssQ0FBQztZQUNILFVBQVUsRUFBRSxVQUFVO1lBQ3RCLElBQUksRUFBRSxJQUFJO1NBQ2IsQ0FBQyxDQUFDO1FBQzNCLE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZDLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDeEIsTUFBTSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3JDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDekMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUN4QyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsY0FBYyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQzNDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDekMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUMzQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3hDLENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLHlFQUF5RSxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ3JGLE1BQU0sTUFBTSxHQUFHLE1BQU0sT0FBTzthQUNILEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQzthQUN0QixLQUFLLENBQUM7WUFDSCxVQUFVLEVBQUUsS0FBSztZQUNqQixJQUFJLEVBQUUsS0FBSztTQUNkLENBQUMsQ0FBQztRQUMzQixNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN2QyxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ3hCLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDdEMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxTQUFTLENBQUMsd0JBQXdCLENBQUMsQ0FBQztJQUM1RCxDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyx5RUFBeUUsRUFBRSxLQUFLLElBQUksRUFBRTtRQUNyRixNQUFNLE1BQU0sR0FBRyxNQUFNLE9BQU87YUFDSCxHQUFHLENBQUMsaUJBQWlCLENBQUM7YUFDdEIsS0FBSyxDQUFDO1lBQ0gsY0FBYyxFQUFFLFdBQVc7U0FDOUIsQ0FBQyxDQUFBO1FBQzFCLE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZDLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDeEIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN0QyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFNBQVMsQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFDO0lBQ3pFLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQyxDQUFDLENBQUM7QUFFSCxRQUFRLENBQUMsd0JBQXdCLEVBQUUsR0FBRyxFQUFFO0lBQ3BDLElBQUksT0FBTyxHQUFHLEVBQUUsQ0FBQztJQUVqQixTQUFTLENBQUMsS0FBSyxJQUFJLEVBQUU7UUFDakIsTUFBTSxHQUFHLEdBQUcsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDO2FBQy9DLEtBQUssQ0FBQztZQUNKLEdBQUcsRUFBRSxXQUFXO1NBQ2xCLENBQUMsQ0FBQztRQUNILE1BQU0sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3BDLE9BQU8sR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDO0lBQ3ZCLENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLDhCQUE4QixFQUFFLEtBQUssSUFBSSxFQUFFO1FBRTFDLE1BQU0sR0FBRyxHQUFHLE1BQU0sT0FBTzthQUNBLElBQUksQ0FBQyxpQkFBaUIsQ0FBQzthQUN2QixJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQzthQUMxQixHQUFHLENBQUMsY0FBYyxFQUFFLGtCQUFrQixDQUFDLENBQUM7UUFDakUsTUFBTSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDcEMsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQztRQUN4QixNQUFNLENBQUMsT0FBTyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDeEMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUM1QyxDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyxvREFBb0QsRUFBRSxLQUFLLElBQUksRUFBRTtRQUNoRSxNQUFNLE1BQU0sR0FBRyxNQUFNLE9BQU87YUFDSCxJQUFJLENBQUMsaUJBQWlCLENBQUM7YUFDdkIsSUFBSSxDQUFDLEVBQUUsQ0FBQzthQUNSLEdBQUcsQ0FBQyxjQUFjLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztRQUNqRSxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN2QyxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ3hCLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDdEMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxTQUFTLENBQUMsc0JBQXNCLENBQUMsQ0FBQztJQUMxRCxDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyw0REFBNEQsRUFBRSxLQUFLLElBQUksRUFBRTtRQUN4RSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRS9CLENBQUMsQ0FBQyxZQUFZLENBQUMsT0FBTyxHQUFHLHVEQUF1RCxDQUFBO1FBRWhGLE1BQU0sTUFBTSxHQUFHLE1BQU0sT0FBTzthQUNILElBQUksQ0FBQyxpQkFBaUIsQ0FBQzthQUN2QixJQUFJLENBQUMsQ0FBQyxDQUFDO2FBQ1AsR0FBRyxDQUFDLGNBQWMsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1FBQ2pFLE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZDLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDeEIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN0QyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFNBQVMsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO0lBQ2xFLENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLHlEQUF5RCxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ3JFLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFL0IsQ0FBQyxDQUFDLFVBQVUsR0FBRyx3QkFBd0IsQ0FBQztRQUV4QyxNQUFNLE1BQU0sR0FBRyxNQUFNLE9BQU87YUFDSCxJQUFJLENBQUMsaUJBQWlCLENBQUM7YUFDdkIsSUFBSSxDQUFDLENBQUMsQ0FBQzthQUNQLEdBQUcsQ0FBQyxjQUFjLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztRQUNqRSxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN2QyxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ3hCLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDdEMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxTQUFTLENBQUMsOEJBQThCLENBQUMsQ0FBQztJQUNsRSxDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyxvRkFBb0YsRUFBRSxLQUFLLElBQUksRUFBRTtRQUNoRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRS9CLENBQUMsQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDO1FBRXJCLE1BQU0sTUFBTSxHQUFHLE1BQU0sT0FBTzthQUNILElBQUksQ0FBQyxpQkFBaUIsQ0FBQzthQUN2QixJQUFJLENBQUMsQ0FBQyxDQUFDO2FBQ1AsR0FBRyxDQUFDLGNBQWMsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1FBQ2pFLE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZDLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDeEIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN0QyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFNBQVMsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO0lBQzFELENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLDREQUE0RCxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ3hFLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFL0IsQ0FBQyxDQUFDLFlBQVksR0FBRyx3QkFBd0IsQ0FBQztRQUUxQyxNQUFNLE1BQU0sR0FBRyxNQUFNLE9BQU87YUFDSCxJQUFJLENBQUMsaUJBQWlCLENBQUM7YUFDdkIsSUFBSSxDQUFDLENBQUMsQ0FBQzthQUNQLEdBQUcsQ0FBQyxjQUFjLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztRQUNqRSxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN2QyxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ3hCLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDdEMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxTQUFTLENBQUMsOEJBQThCLENBQUMsQ0FBQztJQUNsRSxDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyw0REFBNEQsRUFBRSxLQUFLLElBQUksRUFBRTtRQUN4RSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRS9CLENBQUMsQ0FBQyxZQUFZLENBQUMsTUFBTSxHQUFHLHdCQUF3QixDQUFDO1FBRWpELE1BQU0sTUFBTSxHQUFHLE1BQU0sT0FBTzthQUNILElBQUksQ0FBQyxpQkFBaUIsQ0FBQzthQUN2QixJQUFJLENBQUMsQ0FBQyxDQUFDO2FBQ1AsR0FBRyxDQUFDLGNBQWMsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1FBQ2pFLE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZDLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDeEIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN0QyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFNBQVMsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO0lBQ2xFLENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLGlFQUFpRSxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQzdFLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFL0IsQ0FBQyxDQUFDLFlBQVksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEdBQUcsdURBQXVELENBQUE7UUFFakcsTUFBTSxNQUFNLEdBQUcsTUFBTSxPQUFPO2FBQ0gsSUFBSSxDQUFDLGlCQUFpQixDQUFDO2FBQ3ZCLElBQUksQ0FBQyxDQUFDLENBQUM7YUFDUCxHQUFHLENBQUMsY0FBYyxFQUFFLGtCQUFrQixDQUFDLENBQUM7UUFDakUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdkMsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQztRQUN4QixNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3RDLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsU0FBUyxDQUFDLDhCQUE4QixDQUFDLENBQUM7SUFDbEUsQ0FBQyxDQUFDLENBQUM7QUFFUCxDQUFDLENBQUMsQ0FBQztBQUVILFFBQVEsQ0FBQyxrQ0FBa0MsRUFBRSxHQUFHLEVBQUU7SUFDOUMsSUFBSSxPQUFPLEdBQUcsRUFBRSxDQUFDO0lBRWpCLFNBQVMsQ0FBQyxLQUFLLElBQUksRUFBRTtRQUNqQixNQUFNLEdBQUcsR0FBRyxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUM7YUFDL0MsS0FBSyxDQUFDO1lBQ0osR0FBRyxFQUFFLFdBQVc7U0FDbEIsQ0FBQyxDQUFDO1FBQ0gsTUFBTSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDcEMsT0FBTyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUM7SUFDdkIsQ0FBQyxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMsNkNBQTZDLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFFekQsTUFBTSxHQUFHLEdBQUcsTUFBTSxPQUFPO2FBQ0EsSUFBSSxDQUFDLFdBQVcsQ0FBQzthQUNqQixJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQzthQUMxQixHQUFHLENBQUMsY0FBYyxFQUFFLGtCQUFrQixDQUFDLENBQUM7UUFDakUsTUFBTSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDcEMsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQztRQUN4QixNQUFNLENBQUMsT0FBTyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDeEMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN0QyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQzlDLENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLHdEQUF3RCxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ3BFLE1BQU0sTUFBTSxHQUFHLE1BQU0sT0FBTzthQUNILElBQUksQ0FBQyxXQUFXLENBQUM7YUFDakIsSUFBSSxDQUFDLEVBQUUsQ0FBQzthQUNSLEdBQUcsQ0FBQyxjQUFjLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztRQUNqRSxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN2QyxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ3hCLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDdEMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxTQUFTLENBQUMsc0JBQXNCLENBQUMsQ0FBQztJQUMxRCxDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyxnRUFBZ0UsRUFBRSxLQUFLLElBQUksRUFBRTtRQUM1RSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRS9CLENBQUMsQ0FBQyxZQUFZLENBQUMsT0FBTyxHQUFHLHVEQUF1RCxDQUFBO1FBRWhGLE1BQU0sTUFBTSxHQUFHLE1BQU0sT0FBTzthQUNILElBQUksQ0FBQyxXQUFXLENBQUM7YUFDakIsSUFBSSxDQUFDLENBQUMsQ0FBQzthQUNQLEdBQUcsQ0FBQyxjQUFjLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztRQUNqRSxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN2QyxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ3hCLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDdEMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxTQUFTLENBQUMsaUNBQWlDLENBQUMsQ0FBQztJQUNyRSxDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyw2REFBNkQsRUFBRSxLQUFLLElBQUksRUFBRTtRQUN6RSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRS9CLENBQUMsQ0FBQyxVQUFVLEdBQUcsd0JBQXdCLENBQUM7UUFFeEMsTUFBTSxNQUFNLEdBQUcsTUFBTSxPQUFPO2FBQ0gsSUFBSSxDQUFDLFdBQVcsQ0FBQzthQUNqQixJQUFJLENBQUMsQ0FBQyxDQUFDO2FBQ1AsR0FBRyxDQUFDLGNBQWMsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1FBQ2pFLE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZDLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDeEIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN0QyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFNBQVMsQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO0lBQ3JFLENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLHdGQUF3RixFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ3BHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFL0IsQ0FBQyxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7UUFFckIsTUFBTSxNQUFNLEdBQUcsTUFBTSxPQUFPO2FBQ0gsSUFBSSxDQUFDLFdBQVcsQ0FBQzthQUNqQixJQUFJLENBQUMsQ0FBQyxDQUFDO2FBQ1AsR0FBRyxDQUFDLGNBQWMsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1FBQ2pFLE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZDLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDeEIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN0QyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFNBQVMsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO0lBQzFELENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLHFFQUFxRSxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ2pGLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFL0IsQ0FBQyxDQUFDLFlBQVksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEdBQUcsdURBQXVELENBQUE7UUFFakcsTUFBTSxNQUFNLEdBQUcsTUFBTSxPQUFPO2FBQ0gsSUFBSSxDQUFDLFdBQVcsQ0FBQzthQUNqQixJQUFJLENBQUMsQ0FBQyxDQUFDO2FBQ1AsR0FBRyxDQUFDLGNBQWMsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1FBQ2pFLE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZDLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDeEIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN0QyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFNBQVMsQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO0lBQ3JFLENBQUMsQ0FBQyxDQUFDO0FBRVAsQ0FBQyxDQUFDLENBQUM7QUFFSCxRQUFRLENBQUMsMEJBQTBCLEVBQUUsR0FBRyxFQUFFO0lBQ3RDLEVBQUUsQ0FBQyxnQ0FBZ0MsRUFBRSxLQUFLLElBQUksRUFBRTtRQUM1QyxNQUFNLE1BQU0sR0FBRyxNQUFNLE9BQU87YUFDSCxHQUFHLENBQUMsVUFBVSxDQUFDO2FBQ2YsS0FBSyxDQUFDO1lBQ0gsR0FBRyxFQUFFLFdBQVc7U0FDbkIsQ0FBQyxDQUFBO1FBQzFCLE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZDLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDeEIsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdEMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQVMsRUFBRSxFQUFFO1lBQ3RCLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDekMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNqQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2pDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDekMsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyx1REFBdUQsRUFBRSxLQUFLLElBQUksRUFBRTtRQUNuRSxNQUFNLE1BQU0sR0FBRyxNQUFNLE9BQU87YUFDSCxHQUFHLENBQUMsVUFBVSxDQUFDO2FBQ2YsS0FBSyxDQUFDO1lBQ0gsR0FBRyxFQUFFLEdBQUc7U0FDWCxDQUFDLENBQUE7UUFDMUIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdkMsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQztRQUN4QixNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3RDLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsU0FBUyxDQUFDLHVCQUF1QixDQUFDLENBQUM7SUFDM0QsQ0FBQyxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMscURBQXFELEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDakUsTUFBTSxNQUFNLEdBQUcsTUFBTSxPQUFPO2FBQ0gsR0FBRyxDQUFDLFVBQVUsQ0FBQzthQUNmLEtBQUssQ0FBQztZQUNILElBQUksRUFBRSxXQUFXO1NBQ3BCLENBQUMsQ0FBQTtRQUMxQixNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN2QyxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ3hCLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDdEMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxTQUFTLENBQUMscUNBQXFDLENBQUMsQ0FBQztJQUN6RSxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgQVBJR1dfRU5EUE9JTlQ9IHByb2Nlc3MuZW52LkFQSUdXX0VORFBPSU5UO1xuY29uc3QgcmVxdWVzdCA9IHJlcXVpcmUoJ3N1cGVydGVzdCcpKEFQSUdXX0VORFBPSU5UKTtcbmNvbnN0IF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbmNvbnN0IHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG5cbmNvbnN0IHRlbXBsYXRlSW52b2ljZSA9IHtcbiAgICBcImtleVwiOiBcIlRPX0JFX0ZJTExFRFwiLFxuICAgIFwidmFsdWVcIjoge1xuICAgICAgICBcImRhdGVcIjogXCIyMDIxLTA1LTIyXCIsXG4gICAgICAgIFwiYmlsbFRvXCI6IFwiQUJDIENhciBEZWFsZXIgUHRlIEx0ZFwiLFxuICAgICAgICBcInBheW1lbnRTdGF0dXNcIjogXCJQRU5ESU5HXCIsXG4gICAgICAgIFwiY2FySW5mb1wiOiB7XG4gICAgICAgICAgICBcIm1vZGVsXCI6IFwiSG9uZGFcIixcbiAgICAgICAgICAgIFwibWFrZVwiOiBcIkphenpcIixcbiAgICAgICAgICAgIFwieWVhclwiOiAyMDIxLFxuICAgICAgICAgICAgXCJ1bml0UHJpY2VcIjogODkwMDBcbiAgICAgICAgfSxcbiAgICAgICAgXCJxdWFudGl0eVwiOiAxMFxuICAgIH1cbn1cblxuZGVzY3JpYmUoJ0luc2VydCBuZXcgaW52b2ljZScsICgpID0+IHtcbiAgICBpdCgnY2FuIGluc2VydCAxIGludm9pY2UnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGludm9pY2VObyA9ICdURVNUMTAwMDEnO1xuICAgICAgICBsZXQgZGF0YUFycmF5ID0gW107XG4gICAgICAgIGRhdGFBcnJheS5wdXNoKF8uY2xvbmVEZWVwKHRlbXBsYXRlSW52b2ljZSkpO1xuICAgICAgICBkYXRhQXJyYXlbMF0ua2V5ID0gaW52b2ljZU5vO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlcXVlc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnBvc3QoJy8nKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2VuZChkYXRhQXJyYXkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZXQoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgIGV4cGVjdChyZXN1bHQuc3RhdHVzQ29kZSkudG9FcXVhbCgyMDApO1xuICAgICAgICBjb25zdCByZXMgPSByZXN1bHQuYm9keTtcbiAgICAgICAgZXhwZWN0KHR5cGVvZiByZXMpLnRvRXF1YWwoJ29iamVjdCcpO1xuICAgICAgICBleHBlY3QocmVzKS50b0hhdmVQcm9wZXJ0eSgnZG9jdW1lbnRJZCcpO1xuICAgICAgICBleHBlY3QocmVzKS50b0hhdmVQcm9wZXJ0eSgndHhJZCcpO1xuICAgIH0pO1xuXG4gICAgaXQoJ2NhbiBpbnNlcnQgMiBpbnZvaWNlcycsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgaW52b2ljZTFObyA9ICdURVNUMTAwMTEnO1xuICAgICAgICBjb25zdCBpbnZvaWNlMk5vID0gJ1RFU1QxMDAxMic7XG4gICAgICAgIGxldCBkYXRhQXJyYXkgPSBbXTtcbiAgICAgICAgZGF0YUFycmF5LnB1c2goXy5jbG9uZURlZXAodGVtcGxhdGVJbnZvaWNlKSk7XG4gICAgICAgIGRhdGFBcnJheS5wdXNoKF8uY2xvbmVEZWVwKHRlbXBsYXRlSW52b2ljZSkpO1xuICAgICAgICBkYXRhQXJyYXlbMF0ua2V5ID0gaW52b2ljZTFObztcbiAgICAgICAgZGF0YUFycmF5WzFdLmtleSA9IGludm9pY2UyTm87XG5cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVxdWVzdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucG9zdCgnLycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZW5kKGRhdGFBcnJheSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldCgnQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgZXhwZWN0KHJlc3VsdC5zdGF0dXNDb2RlKS50b0VxdWFsKDIwMCk7XG4gICAgICAgIGNvbnN0IHJlcyA9IHJlc3VsdC5ib2R5O1xuICAgICAgICBleHBlY3QoQXJyYXkuaXNBcnJheShyZXMpKS50b0JlKHRydWUpO1xuICAgICAgICByZXMuZm9yRWFjaCgocjogT2JqZWN0KSA9PiB7XG4gICAgICAgICAgICBleHBlY3QocikudG9IYXZlUHJvcGVydHkoJ2RvY3VtZW50SWQnKTtcbiAgICAgICAgICAgIGV4cGVjdChyKS50b0hhdmVQcm9wZXJ0eSgndHhJZCcpO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdjYW5ub3QgaW5zZXJ0IDAgaW52b2ljZScsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVxdWVzdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucG9zdCgnLycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZW5kKFtdKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2V0KCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICBleHBlY3QocmVzdWx0LnN0YXR1c0NvZGUpLnRvRXF1YWwoNDAwKTtcbiAgICAgICAgY29uc3QgcmVzID0gcmVzdWx0LmJvZHk7XG4gICAgICAgIGV4cGVjdChyZXMpLnRvSGF2ZVByb3BlcnR5KCdtZXNzYWdlJyk7XG4gICAgICAgIGV4cGVjdChyZXMubWVzc2FnZSkudG9Db250YWluKCdJbnZhbGlkIHJlcXVlc3QgYm9keScpO1xuICAgIH0pO1xuICAgIFxuICAgIGl0KCdjYW5ub3QgaW5zZXJ0IG1vcmUgdGhhbiAxMCBpbnZvaWNlcycsIGFzeW5jICgpID0+IHtcbiAgICAgICAgbGV0IGRhdGFBcnJheSA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDExOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGludm9pY2VObyA9IGBURVNUMTAwMiR7aX1gO1xuICAgICAgICAgICAgZGF0YUFycmF5LnB1c2goXy5jbG9uZURlZXAodGVtcGxhdGVJbnZvaWNlKSk7XG4gICAgICAgICAgICBkYXRhQXJyYXlbaV0ua2V5ID0gaW52b2ljZU5vO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlcXVlc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnBvc3QoJy8nKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2VuZChkYXRhQXJyYXkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZXQoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgIGV4cGVjdChyZXN1bHQuc3RhdHVzQ29kZSkudG9FcXVhbCg0MDApO1xuICAgICAgICBjb25zdCByZXMgPSByZXN1bHQuYm9keTtcbiAgICAgICAgZXhwZWN0KHJlcykudG9IYXZlUHJvcGVydHkoJ21lc3NhZ2UnKTtcbiAgICAgICAgZXhwZWN0KHJlcy5tZXNzYWdlKS50b0NvbnRhaW4oJ0ludmFsaWQgcmVxdWVzdCBib2R5Jyk7XG4gICAgfSk7XG5cbiAgICBpdCgnY2Fubm90IGluc2VydCBpbnZvaWNlIHdpdGggaW1wcm9wZXIgZm9ybWF0JywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBsZXQgZGF0YUFycmF5ID0gW107XG4gICAgICAgIGRhdGFBcnJheS5wdXNoKF8uY2xvbmVEZWVwKHRlbXBsYXRlSW52b2ljZSkpO1xuICAgICAgICBjb25zdCBpbnZvaWNlTm8gPSAnVEVTVDEwMDMxJztcbiAgICAgICAgZGF0YUFycmF5WzBdLmtleSA9IGludm9pY2VObztcbiAgICAgICAgZGVsZXRlIGRhdGFBcnJheVswXS52YWx1ZS5iaWxsVG87XG5cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVxdWVzdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucG9zdCgnLycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZW5kKGRhdGFBcnJheSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldCgnQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgZXhwZWN0KHJlc3VsdC5zdGF0dXNDb2RlKS50b0VxdWFsKDQwMCk7XG4gICAgICAgIGNvbnN0IHJlcyA9IHJlc3VsdC5ib2R5O1xuICAgICAgICBleHBlY3QocmVzKS50b0hhdmVQcm9wZXJ0eSgnbWVzc2FnZScpO1xuICAgICAgICBleHBlY3QocmVzLm1lc3NhZ2UpLnRvQ29udGFpbignSW52YWxpZCByZXF1ZXN0IGJvZHknKTtcblxuICAgIH0pO1xuXG4gICAgaXQoJ2Nhbm5vdCBpbnNlcnQgaW52b2ljZXMgd2l0aCBkdXBsaWNhdGUga2V5cycsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgaW52b2ljZTFObyA9ICdURVNUMTAwNDEnO1xuICAgICAgICBjb25zdCBpbnZvaWNlMk5vID0gJ1RFU1QxMDA0MSc7XG4gICAgICAgIGxldCBkYXRhQXJyYXkgPSBbXTtcbiAgICAgICAgZGF0YUFycmF5LnB1c2goXy5jbG9uZURlZXAodGVtcGxhdGVJbnZvaWNlKSk7XG4gICAgICAgIGRhdGFBcnJheS5wdXNoKF8uY2xvbmVEZWVwKHRlbXBsYXRlSW52b2ljZSkpO1xuICAgICAgICBkYXRhQXJyYXlbMF0ua2V5ID0gaW52b2ljZTFObztcbiAgICAgICAgZGF0YUFycmF5WzFdLmtleSA9IGludm9pY2UyTm87XG5cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVxdWVzdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucG9zdCgnLycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZW5kKGRhdGFBcnJheSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldCgnQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgZXhwZWN0KHJlc3VsdC5zdGF0dXNDb2RlKS50b0VxdWFsKDQwMCk7XG4gICAgICAgIGNvbnN0IHJlcyA9IHJlc3VsdC5ib2R5O1xuICAgICAgICBleHBlY3QocmVzKS50b0hhdmVQcm9wZXJ0eSgnbWVzc2FnZScpO1xuICAgICAgICBleHBlY3QocmVzLm1lc3NhZ2UpLnRvQ29udGFpbignRHVwbGljYXRlIGtleScpO1xuICAgIH0pO1xufSk7XG5cbmRlc2NyaWJlKCdSZXRyaWV2ZSBpbnZvaWNlcycsICgpID0+IHtcbiAgICBpdCgnY2FuIHJldHJpZXZlIDEgaW52b2ljZScsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVxdWVzdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZ2V0KCcvJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnF1ZXJ5KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleXM6ICdURVNUMTAwMDEnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZXQoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgIGV4cGVjdChyZXN1bHQuc3RhdHVzQ29kZSkudG9FcXVhbCgyMDApO1xuICAgICAgICBjb25zdCByZXMgPSByZXN1bHQuYm9keTtcbiAgICAgICAgZXhwZWN0KHR5cGVvZiByZXMpLnRvRXF1YWwoJ29iamVjdCcpO1xuICAgICAgICBleHBlY3QocmVzKS50b0hhdmVQcm9wZXJ0eSgncXVhbnRpdHknKTtcbiAgICAgICAgZXhwZWN0KHJlcykudG9IYXZlUHJvcGVydHkoJ2RhdGUnKTtcbiAgICAgICAgZXhwZWN0KHJlcykudG9IYXZlUHJvcGVydHkoJ2JpbGxUbycpO1xuICAgICAgICBleHBlY3QocmVzKS50b0hhdmVQcm9wZXJ0eSgnY2FySW5mbycpO1xuICAgIH0pO1xuXG4gICAgaXQoJ2NhbiByZXRyaWV2ZSBtdWx0aXBsZSBpbnZvaWNlcycsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVxdWVzdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZ2V0KCcvJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnF1ZXJ5KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleXM6ICdURVNUMTAwMDEsVEVTVDEwMDEyJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2V0KCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICBleHBlY3QocmVzdWx0LnN0YXR1c0NvZGUpLnRvRXF1YWwoMjAwKTtcbiAgICAgICAgY29uc3QgcmVzID0gcmVzdWx0LmJvZHk7XG4gICAgICAgIGV4cGVjdChBcnJheS5pc0FycmF5KHJlcykpLnRvQmUodHJ1ZSk7XG4gICAgICAgIGV4cGVjdChyZXMubGVuZ3RoKS50b0VxdWFsKDIpO1xuICAgICAgICByZXMuZm9yRWFjaCgocjogT2JqZWN0KSA9PiB7XG4gICAgICAgICAgICBleHBlY3QocikudG9IYXZlUHJvcGVydHkoJ3F1YW50aXR5Jyk7XG4gICAgICAgICAgICBleHBlY3QocikudG9IYXZlUHJvcGVydHkoJ2RhdGUnKTtcbiAgICAgICAgICAgIGV4cGVjdChyKS50b0hhdmVQcm9wZXJ0eSgnYmlsbFRvJyk7XG4gICAgICAgICAgICBleHBlY3QocikudG9IYXZlUHJvcGVydHkoJ2NhckluZm8nKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnY2Fubm90IHJldHJpZXZlIG1vcmUgdGhhbiAzMiBpbnZvaWNlcyBhdCB0aGUgc2FtZSB0aW1lJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByZXF1ZXN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5nZXQoJy8nKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucXVlcnkoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5czogJ1RFU1QxMDAwMSxURVNUMTAwMTIsQSxCLEMsRCxFLEYsRyxILEksSixLLEwsTSxOLE8sUCxRLFIsUyxULFUsVixXLFgsWSxaLEFBLEFCLEFDLEFELEFFLEFGLEFHJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2V0KCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICBleHBlY3QocmVzdWx0LnN0YXR1c0NvZGUpLnRvRXF1YWwoNDAwKTtcbiAgICAgICAgY29uc3QgcmVzID0gcmVzdWx0LmJvZHk7XG4gICAgICAgIGV4cGVjdChyZXMpLnRvSGF2ZVByb3BlcnR5KCdtZXNzYWdlJyk7XG4gICAgICAgIGV4cGVjdChyZXMubWVzc2FnZSkudG9Db250YWluKCdSZXF1ZXN0ZWQgZG9jdW1lbnRzIGRvIG5vdCBleGlzdCcpO1xuXG4gICAgfSk7XG5cbiAgICBpdCgnY2Fubm90IHJldHJpZXZlIGludm9pY2VzIHRoYXQgZG8gbm90IGV4aXN0JywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByZXF1ZXN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5nZXQoJy8nKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucXVlcnkoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5czogJ0EsQidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldCgnQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgZXhwZWN0KHJlc3VsdC5zdGF0dXNDb2RlKS50b0VxdWFsKDQwMCk7XG4gICAgICAgIGNvbnN0IHJlcyA9IHJlc3VsdC5ib2R5O1xuICAgICAgICBleHBlY3QocmVzKS50b0hhdmVQcm9wZXJ0eSgnbWVzc2FnZScpO1xuICAgICAgICBleHBlY3QocmVzLm1lc3NhZ2UpLnRvQ29udGFpbignUmVxdWVzdGVkIGRvY3VtZW50cyBkbyBub3QgZXhpc3QnKTtcbiAgICB9KTtcblxuICAgIGl0KCdjYW5ub3QgcmV0cmlldmUgaW52b2ljZXMgd2l0aG91dCBcImtleXNcIiBxdWVyeSBzdHJpbmcnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlcXVlc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmdldCgnLycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5xdWVyeSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk6ICdURVNUMTAwMDEnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZXQoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgIGV4cGVjdChyZXN1bHQuc3RhdHVzQ29kZSkudG9FcXVhbCg0MDApO1xuICAgICAgICBjb25zdCByZXMgPSByZXN1bHQuYm9keTtcbiAgICAgICAgZXhwZWN0KHJlcykudG9IYXZlUHJvcGVydHkoJ21lc3NhZ2UnKTtcbiAgICAgICAgZXhwZWN0KHJlcy5tZXNzYWdlKS50b0NvbnRhaW4oJ01pc3NpbmcgcmVxdWlyZWQgcmVxdWVzdCBwYXJhbWV0ZXJzJyk7XG4gICAgfSk7XG59KTtcblxuZGVzY3JpYmUoJ0dldCBpbnZvaWNlIHJlY2VpcHQgYnkga2V5JywgKCkgPT4ge1xuICAgIGl0KCdjYW4gZ2V0IDEgaW52b2ljZSByZWNlaXB0IGJ5IGtleScsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVxdWVzdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZ2V0KCcvcmVjZWlwdC1ieS1rZXknKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucXVlcnkoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5OiAnVEVTVDEwMDAxJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgZXhwZWN0KHJlc3VsdC5zdGF0dXNDb2RlKS50b0VxdWFsKDIwMCk7XG4gICAgICAgIGNvbnN0IHJlcyA9IHJlc3VsdC5ib2R5O1xuICAgICAgICBleHBlY3QodHlwZW9mIHJlcykudG9FcXVhbCgnb2JqZWN0Jyk7XG4gICAgICAgIGV4cGVjdChyZXMpLnRvSGF2ZVByb3BlcnR5KCdMZWRnZXJOYW1lJyk7XG4gICAgICAgIGV4cGVjdChyZXMpLnRvSGF2ZVByb3BlcnR5KCdUYWJsZU5hbWUnKTtcbiAgICAgICAgZXhwZWN0KHJlcykudG9IYXZlUHJvcGVydHkoJ0Jsb2NrQWRkcmVzcycpO1xuICAgICAgICBleHBlY3QocmVzKS50b0hhdmVQcm9wZXJ0eSgnRG9jdW1lbnRJZCcpO1xuICAgICAgICBleHBlY3QocmVzKS50b0hhdmVQcm9wZXJ0eSgnUmV2aXNpb25IYXNoJyk7XG4gICAgICAgIGV4cGVjdChyZXMpLnRvSGF2ZVByb3BlcnR5KCdQcm9vZicpO1xuICAgIH0pO1xuXG4gICAgaXQoJ2Nhbm5vdCBnZXQgaW52b2ljZSByZWNlaXB0IGZvciBrZXkgdGhhdCBkb2VzIG5vdCBleGlzdCcsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVxdWVzdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZ2V0KCcvcmVjZWlwdC1ieS1rZXknKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucXVlcnkoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5OiAnWFlaJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgZXhwZWN0KHJlc3VsdC5zdGF0dXNDb2RlKS50b0VxdWFsKDQwMCk7XG4gICAgICAgIGNvbnN0IHJlcyA9IHJlc3VsdC5ib2R5O1xuICAgICAgICBleHBlY3QocmVzKS50b0hhdmVQcm9wZXJ0eSgnbWVzc2FnZScpO1xuICAgICAgICBleHBlY3QocmVzLm1lc3NhZ2UpLnRvQ29udGFpbignQ291bGQgbm90IGdldCBtZXRhZGF0YScpO1xuICAgIH0pO1xuXG4gICAgaXQoJ2Nhbm5vdCByZXRyaWV2ZSByZWNlaXB0IHdpdGhvdXQgXCJrZXlcIiBxdWVyeSBzdHJpbmcnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlcXVlc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmdldCgnL3JlY2VpcHQtYnkta2V5JylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnF1ZXJ5KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvbWVfb3RoZXJfa2V5OiAnVEVTVDEwMDAxJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICBleHBlY3QocmVzdWx0LnN0YXR1c0NvZGUpLnRvRXF1YWwoNDAwKTtcbiAgICAgICAgY29uc3QgcmVzID0gcmVzdWx0LmJvZHk7XG4gICAgICAgIGV4cGVjdChyZXMpLnRvSGF2ZVByb3BlcnR5KCdtZXNzYWdlJyk7XG4gICAgICAgIGV4cGVjdChyZXMubWVzc2FnZSkudG9Db250YWluKCdNaXNzaW5nIHJlcXVpcmVkIHJlcXVlc3QgcGFyYW1ldGVycycpO1xuICAgIH0pO1xufSk7XG5cbmRlc2NyaWJlKCdHZXQgaW52b2ljZSByZWNlaXB0IGJ5IGRvY3VtZW50SWQgYW5kIHR4SWQnLCAoKSA9PiB7XG4gICAgaXQoJ2NhbiBnZXQgMSBpbnZvaWNlIHJlY2VpcHQgYnkgZG9jdW1lbnRJZCBhbmQgdHhJZCcsIGFzeW5jICgpID0+IHtcblxuICAgICAgICBjb25zdCBpbnZvaWNlTm8gPSAnVEVTVDQwMDAxJztcbiAgICAgICAgbGV0IGRhdGFBcnJheSA9IFtdO1xuICAgICAgICBkYXRhQXJyYXkucHVzaChfLmNsb25lRGVlcCh0ZW1wbGF0ZUludm9pY2UpKTtcbiAgICAgICAgZGF0YUFycmF5WzBdLmtleSA9IGludm9pY2VObztcblxuICAgICAgICBjb25zdCBpbmZvID0gYXdhaXQgcmVxdWVzdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucG9zdCgnLycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZW5kKGRhdGFBcnJheSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldCgnQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgXG4gICAgICAgIGV4cGVjdChpbmZvLnN0YXR1c0NvZGUpLnRvRXF1YWwoMjAwKTtcbiAgICAgICAgY29uc3QgZG9jdW1lbnRJZCA9IGluZm8uYm9keS5kb2N1bWVudElkO1xuICAgICAgICBjb25zdCB0eElkID0gaW5mby5ib2R5LnR4SWQ7XG5cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVxdWVzdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZ2V0KCcvcmVjZWlwdC1ieS1kb2MnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucXVlcnkoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnRJZDogZG9jdW1lbnRJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR4SWQ6IHR4SWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdChyZXN1bHQuc3RhdHVzQ29kZSkudG9FcXVhbCgyMDApO1xuICAgICAgICBjb25zdCByZXMgPSByZXN1bHQuYm9keTtcbiAgICAgICAgZXhwZWN0KHR5cGVvZiByZXMpLnRvRXF1YWwoJ29iamVjdCcpO1xuICAgICAgICBleHBlY3QocmVzKS50b0hhdmVQcm9wZXJ0eSgnTGVkZ2VyTmFtZScpO1xuICAgICAgICBleHBlY3QocmVzKS50b0hhdmVQcm9wZXJ0eSgnVGFibGVOYW1lJyk7XG4gICAgICAgIGV4cGVjdChyZXMpLnRvSGF2ZVByb3BlcnR5KCdCbG9ja0FkZHJlc3MnKTtcbiAgICAgICAgZXhwZWN0KHJlcykudG9IYXZlUHJvcGVydHkoJ0RvY3VtZW50SWQnKTtcbiAgICAgICAgZXhwZWN0KHJlcykudG9IYXZlUHJvcGVydHkoJ1JldmlzaW9uSGFzaCcpO1xuICAgICAgICBleHBlY3QocmVzKS50b0hhdmVQcm9wZXJ0eSgnUHJvb2YnKTtcbiAgICB9KTtcblxuICAgIGl0KCdjYW5ub3QgZ2V0IGludm9pY2UgcmVjZWlwdCBmb3IgZG9jdW1lbnRJZCBhbmQvb3IgdHhJZCB0aGF0IGRvIG5vdCBleGlzdCcsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVxdWVzdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZ2V0KCcvcmVjZWlwdC1ieS1kb2MnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucXVlcnkoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnRJZDogJ0FCQycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eElkOiAnWFlaJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgZXhwZWN0KHJlc3VsdC5zdGF0dXNDb2RlKS50b0VxdWFsKDQwMCk7XG4gICAgICAgIGNvbnN0IHJlcyA9IHJlc3VsdC5ib2R5O1xuICAgICAgICBleHBlY3QocmVzKS50b0hhdmVQcm9wZXJ0eSgnbWVzc2FnZScpO1xuICAgICAgICBleHBlY3QocmVzLm1lc3NhZ2UpLnRvQ29udGFpbignQ291bGQgbm90IGdldCBtZXRhZGF0YScpO1xuICAgIH0pO1xuXG4gICAgaXQoJ2Nhbm5vdCByZXRyaWV2ZSByZWNlaXB0IHdpdGhvdXQgXCJkb2N1bWVudElkXCIgYW5kL29yIFwidHhJZFwiIHF1ZXJ5IHN0cmluZycsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVxdWVzdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZ2V0KCcvcmVjZWlwdC1ieS1kb2MnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucXVlcnkoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc29tZV9vdGhlcl9rZXk6ICdURVNUMTAwMDEnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgIGV4cGVjdChyZXN1bHQuc3RhdHVzQ29kZSkudG9FcXVhbCg0MDApO1xuICAgICAgICBjb25zdCByZXMgPSByZXN1bHQuYm9keTtcbiAgICAgICAgZXhwZWN0KHJlcykudG9IYXZlUHJvcGVydHkoJ21lc3NhZ2UnKTtcbiAgICAgICAgZXhwZWN0KHJlcy5tZXNzYWdlKS50b0NvbnRhaW4oJ01pc3NpbmcgcmVxdWlyZWQgcmVxdWVzdCBwYXJhbWV0ZXJzJyk7XG4gICAgfSk7XG59KTtcblxuZGVzY3JpYmUoJ1ZlcmlmeSBpbnZvaWNlIHJlY2VpcHQnLCAoKSA9PiB7XG4gICAgbGV0IHJlY2VpcHQgPSB7fTtcblxuICAgIGJlZm9yZUFsbChhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IHJlcXVlc3QuZ2V0KCcvcmVjZWlwdC1ieS1rZXknKVxuICAgICAgICAucXVlcnkoe1xuICAgICAgICAgICBrZXk6ICdURVNUMTAwMDEnXG4gICAgICAgIH0pO1xuICAgICAgICBleHBlY3QocmVzLnN0YXR1c0NvZGUpLnRvRXF1YWwoMjAwKTtcbiAgICAgICAgcmVjZWlwdCA9IHJlcy5ib2R5O1xuICAgIH0pO1xuXG4gICAgaXQoJ2NhbiB2ZXJpZnkgMSBpbnZvaWNlIHJlY2VpcHQnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIFxuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCByZXF1ZXN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5wb3N0KCcvdmVyaWZ5LXJlY2VpcHQnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2VuZChfLmNsb25lRGVlcChyZWNlaXB0KSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldCgnQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgZXhwZWN0KHJlcy5zdGF0dXNDb2RlKS50b0VxdWFsKDIwMCk7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHJlcy5ib2R5O1xuICAgICAgICBleHBlY3QodHlwZW9mIHJlc3VsdCkudG9FcXVhbCgnb2JqZWN0Jyk7XG4gICAgICAgIGV4cGVjdChyZXN1bHQpLnRvSGF2ZVByb3BlcnR5KCdyZXN1bHQnKTtcbiAgICB9KTtcblxuICAgIGl0KCdjYW5ub3QgdmVyaWZ5IGludm9pY2UgcmVjZWlwdCB3aXRoIGltcHJvcGVyIGZvcm1hdCcsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVxdWVzdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucG9zdCgnL3ZlcmlmeS1yZWNlaXB0JylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNlbmQoe30pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZXQoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgIGV4cGVjdChyZXN1bHQuc3RhdHVzQ29kZSkudG9FcXVhbCg0MDApO1xuICAgICAgICBjb25zdCByZXMgPSByZXN1bHQuYm9keTtcbiAgICAgICAgZXhwZWN0KHJlcykudG9IYXZlUHJvcGVydHkoJ21lc3NhZ2UnKTtcbiAgICAgICAgZXhwZWN0KHJlcy5tZXNzYWdlKS50b0NvbnRhaW4oJ0ludmFsaWQgcmVxdWVzdCBib2R5Jyk7XG4gICAgfSk7XG5cbiAgICBpdCgnY2Fubm90IHZlcmlmeSBpbnZvaWNlIHJlY2VpcHQgd2l0aCBpbmNvcnJlY3QgYmxvY2sgYWRkcmVzcycsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgbSA9IF8uY2xvbmVEZWVwKHJlY2VpcHQpO1xuXG4gICAgICAgIG0uQmxvY2tBZGRyZXNzLklvblRleHQgPSBcIntzdHJhbmRJZDogXFxcImFiY2RlZmdoaWprbG1ub3Bxc3R1dndcXFwiLCBzZXF1ZW5jZU5vOiAzfVwiXG5cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVxdWVzdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucG9zdCgnL3ZlcmlmeS1yZWNlaXB0JylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNlbmQobSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldCgnQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgZXhwZWN0KHJlc3VsdC5zdGF0dXNDb2RlKS50b0VxdWFsKDQwMCk7XG4gICAgICAgIGNvbnN0IHJlcyA9IHJlc3VsdC5ib2R5O1xuICAgICAgICBleHBlY3QocmVzKS50b0hhdmVQcm9wZXJ0eSgnbWVzc2FnZScpO1xuICAgICAgICBleHBlY3QocmVzLm1lc3NhZ2UpLnRvQ29udGFpbignQ291bGQgbm90IHZlcmlmeSB0aGUgbWV0YWR0YScpO1xuICAgIH0pO1xuXG4gICAgaXQoJ2Nhbm5vdCB2ZXJpZnkgaW52b2ljZSByZWNlaXB0IHdpdGggaW5jb3JyZWN0IGRvY3VtZW50SWQnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IG0gPSBfLmNsb25lRGVlcChyZWNlaXB0KTtcblxuICAgICAgICBtLkRvY3VtZW50SWQgPSAnYWJjZGVmZ2hpamtsbW5vcHFzdHV2dyc7XG5cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVxdWVzdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucG9zdCgnL3ZlcmlmeS1yZWNlaXB0JylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNlbmQobSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldCgnQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgZXhwZWN0KHJlc3VsdC5zdGF0dXNDb2RlKS50b0VxdWFsKDQwMCk7XG4gICAgICAgIGNvbnN0IHJlcyA9IHJlc3VsdC5ib2R5O1xuICAgICAgICBleHBlY3QocmVzKS50b0hhdmVQcm9wZXJ0eSgnbWVzc2FnZScpO1xuICAgICAgICBleHBlY3QocmVzLm1lc3NhZ2UpLnRvQ29udGFpbignQ291bGQgbm90IHZlcmlmeSB0aGUgbWV0YWR0YScpO1xuICAgIH0pO1xuXG4gICAgaXQoJ2Nhbm5vdCB2ZXJpZnkgaW52b2ljZSByZWNlaXB0IHdpdGggaW5jb3JyZWN0IGRvY3VtZW50SWQgbGVuZ3RoIChub3QgMjIgY2hhcmFjdGVycyknLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IG0gPSBfLmNsb25lRGVlcChyZWNlaXB0KTtcblxuICAgICAgICBtLkRvY3VtZW50SWQgPSAnWFlaJztcblxuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByZXF1ZXN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5wb3N0KCcvdmVyaWZ5LXJlY2VpcHQnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2VuZChtKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2V0KCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICBleHBlY3QocmVzdWx0LnN0YXR1c0NvZGUpLnRvRXF1YWwoNDAwKTtcbiAgICAgICAgY29uc3QgcmVzID0gcmVzdWx0LmJvZHk7XG4gICAgICAgIGV4cGVjdChyZXMpLnRvSGF2ZVByb3BlcnR5KCdtZXNzYWdlJyk7XG4gICAgICAgIGV4cGVjdChyZXMubWVzc2FnZSkudG9Db250YWluKCdJbnZhbGlkIHJlcXVlc3QgYm9keScpO1xuICAgIH0pO1xuXG4gICAgaXQoJ2Nhbm5vdCB2ZXJpZnkgaW52b2ljZSByZWNlaXB0IHdpdGggaW5jb3JyZWN0IHJldmlzaW9uIGhhc2gnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IG0gPSBfLmNsb25lRGVlcChyZWNlaXB0KTtcblxuICAgICAgICBtLlJldmlzaW9uSGFzaCA9ICdhYmNkZWZnaGlqa2xtbm9wcXN0dXZ3JztcblxuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByZXF1ZXN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5wb3N0KCcvdmVyaWZ5LXJlY2VpcHQnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2VuZChtKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2V0KCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICBleHBlY3QocmVzdWx0LnN0YXR1c0NvZGUpLnRvRXF1YWwoNDAwKTtcbiAgICAgICAgY29uc3QgcmVzID0gcmVzdWx0LmJvZHk7XG4gICAgICAgIGV4cGVjdChyZXMpLnRvSGF2ZVByb3BlcnR5KCdtZXNzYWdlJyk7XG4gICAgICAgIGV4cGVjdChyZXMubWVzc2FnZSkudG9Db250YWluKCdDb3VsZCBub3QgdmVyaWZ5IHRoZSBtZXRhZHRhJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnY2Fubm90IHZlcmlmeSBpbnZvaWNlIHJlY2VpcHQgd2l0aCBpbmNvcnJlY3QgbGVkZ2VyIGRpZ2VzdCcsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgbSA9IF8uY2xvbmVEZWVwKHJlY2VpcHQpO1xuXG4gICAgICAgIG0uTGVkZ2VyRGlnZXN0LkRpZ2VzdCA9ICdhYmNkZWZnaGlqa2xtbm9wcXN0dXZ3JztcblxuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByZXF1ZXN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5wb3N0KCcvdmVyaWZ5LXJlY2VpcHQnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2VuZChtKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2V0KCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICBleHBlY3QocmVzdWx0LnN0YXR1c0NvZGUpLnRvRXF1YWwoNDAwKTtcbiAgICAgICAgY29uc3QgcmVzID0gcmVzdWx0LmJvZHk7XG4gICAgICAgIGV4cGVjdChyZXMpLnRvSGF2ZVByb3BlcnR5KCdtZXNzYWdlJyk7XG4gICAgICAgIGV4cGVjdChyZXMubWVzc2FnZSkudG9Db250YWluKCdDb3VsZCBub3QgdmVyaWZ5IHRoZSBtZXRhZHRhJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnY2Fubm90IHZlcmlmeSBpbnZvaWNlIHJlY2VpcHQgd2l0aCBpbmNvcnJlY3QgZGlnZXN0IHRpcCBhZGRyZXNzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBtID0gXy5jbG9uZURlZXAocmVjZWlwdCk7XG5cbiAgICAgICAgbS5MZWRnZXJEaWdlc3QuRGlnZXN0VGlwQWRkcmVzcy5Jb25UZXh0ID0gXCJ7c3RyYW5kSWQ6IFxcXCJhYmNkZWZnaGlqa2xtbm9wcXN0dXZ3XFxcIiwgc2VxdWVuY2VObzogOH1cIlxuXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlcXVlc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnBvc3QoJy92ZXJpZnktcmVjZWlwdCcpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZW5kKG0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZXQoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgIGV4cGVjdChyZXN1bHQuc3RhdHVzQ29kZSkudG9FcXVhbCg0MDApO1xuICAgICAgICBjb25zdCByZXMgPSByZXN1bHQuYm9keTtcbiAgICAgICAgZXhwZWN0KHJlcykudG9IYXZlUHJvcGVydHkoJ21lc3NhZ2UnKTtcbiAgICAgICAgZXhwZWN0KHJlcy5tZXNzYWdlKS50b0NvbnRhaW4oJ0NvdWxkIG5vdCB2ZXJpZnkgdGhlIG1ldGFkdGEnKTtcbiAgICB9KTtcblxufSk7XG5cbmRlc2NyaWJlKCdHZXQgZG9jdW1lbnQgcmV2aXNpb24gYnkgcmVjZWlwdCcsICgpID0+IHtcbiAgICBsZXQgcmVjZWlwdCA9IHt9O1xuXG4gICAgYmVmb3JlQWxsKGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgcmVxdWVzdC5nZXQoJy9yZWNlaXB0LWJ5LWtleScpXG4gICAgICAgIC5xdWVyeSh7XG4gICAgICAgICAgIGtleTogJ1RFU1QxMDAwMSdcbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdChyZXMuc3RhdHVzQ29kZSkudG9FcXVhbCgyMDApO1xuICAgICAgICByZWNlaXB0ID0gcmVzLmJvZHk7XG4gICAgfSk7XG5cbiAgICBpdCgnY2FuIHJldHJpZXZlIDEgZG9jdW1lbnQgcmV2aXNpb24gYnkgcmVjZWlwdCcsIGFzeW5jICgpID0+IHtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IHJlcXVlc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnBvc3QoJy9yZXZpc2lvbicpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZW5kKF8uY2xvbmVEZWVwKHJlY2VpcHQpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2V0KCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICBleHBlY3QocmVzLnN0YXR1c0NvZGUpLnRvRXF1YWwoMjAwKTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gcmVzLmJvZHk7XG4gICAgICAgIGV4cGVjdCh0eXBlb2YgcmVzdWx0KS50b0VxdWFsKCdvYmplY3QnKTtcbiAgICAgICAgZXhwZWN0KHJlc3VsdCkudG9IYXZlUHJvcGVydHkoJ2RhdGEnKTtcbiAgICAgICAgZXhwZWN0KHJlc3VsdCkudG9IYXZlUHJvcGVydHkoJ21ldGFkYXRhJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnY2Fubm90IHJldHJpZXZlIGRvY3VtZW50IHJldmlzaW9uIHdpdGggaW1wcm9wZXIgZm9ybWF0JywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByZXF1ZXN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5wb3N0KCcvcmV2aXNpb24nKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2VuZCh7fSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldCgnQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgZXhwZWN0KHJlc3VsdC5zdGF0dXNDb2RlKS50b0VxdWFsKDQwMCk7XG4gICAgICAgIGNvbnN0IHJlcyA9IHJlc3VsdC5ib2R5O1xuICAgICAgICBleHBlY3QocmVzKS50b0hhdmVQcm9wZXJ0eSgnbWVzc2FnZScpO1xuICAgICAgICBleHBlY3QocmVzLm1lc3NhZ2UpLnRvQ29udGFpbignSW52YWxpZCByZXF1ZXN0IGJvZHknKTtcbiAgICB9KTtcblxuICAgIGl0KCdjYW5ub3QgcmV0cmlldmUgZG9jdW1lbnQgcmV2aXNpb24gd2l0aCBpbmNvcnJlY3QgYmxvY2sgYWRkcmVzcycsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgbSA9IF8uY2xvbmVEZWVwKHJlY2VpcHQpO1xuXG4gICAgICAgIG0uQmxvY2tBZGRyZXNzLklvblRleHQgPSBcIntzdHJhbmRJZDogXFxcImFiY2RlZmdoaWprbG1ub3Bxc3R1dndcXFwiLCBzZXF1ZW5jZU5vOiAzfVwiXG5cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVxdWVzdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucG9zdCgnL3JldmlzaW9uJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNlbmQobSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldCgnQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgZXhwZWN0KHJlc3VsdC5zdGF0dXNDb2RlKS50b0VxdWFsKDQwMCk7XG4gICAgICAgIGNvbnN0IHJlcyA9IHJlc3VsdC5ib2R5O1xuICAgICAgICBleHBlY3QocmVzKS50b0hhdmVQcm9wZXJ0eSgnbWVzc2FnZScpO1xuICAgICAgICBleHBlY3QocmVzLm1lc3NhZ2UpLnRvQ29udGFpbignQ291bGQgbm90IGdldCBkb2N1bWVudCByZXZpc2lvbicpO1xuICAgIH0pO1xuXG4gICAgaXQoJ2Nhbm5vdCByZXRyaWV2ZSBkb2N1bWVudCByZXZpc2lvbiB3aXRoIGluY29ycmVjdCBkb2N1bWVudElkJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBtID0gXy5jbG9uZURlZXAocmVjZWlwdCk7XG5cbiAgICAgICAgbS5Eb2N1bWVudElkID0gJ2FiY2RlZmdoaWprbG1ub3Bxc3R1dncnO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlcXVlc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnBvc3QoJy9yZXZpc2lvbicpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZW5kKG0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZXQoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgIGV4cGVjdChyZXN1bHQuc3RhdHVzQ29kZSkudG9FcXVhbCg0MDApO1xuICAgICAgICBjb25zdCByZXMgPSByZXN1bHQuYm9keTtcbiAgICAgICAgZXhwZWN0KHJlcykudG9IYXZlUHJvcGVydHkoJ21lc3NhZ2UnKTtcbiAgICAgICAgZXhwZWN0KHJlcy5tZXNzYWdlKS50b0NvbnRhaW4oJ0NvdWxkIG5vdCBnZXQgZG9jdW1lbnQgcmV2aXNpb24nKTtcbiAgICB9KTtcblxuICAgIGl0KCdjYW5ub3QgcmV0cmlldmUgZG9jdW1lbnQgcmV2aXNpb24gd2l0aCBpbmNvcnJlY3QgZG9jdW1lbnRJZCBsZW5ndGggKG5vdCAyMiBjaGFyYWN0ZXJzKScsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgbSA9IF8uY2xvbmVEZWVwKHJlY2VpcHQpO1xuXG4gICAgICAgIG0uRG9jdW1lbnRJZCA9ICdYWVonO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlcXVlc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnBvc3QoJy9yZXZpc2lvbicpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZW5kKG0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZXQoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgIGV4cGVjdChyZXN1bHQuc3RhdHVzQ29kZSkudG9FcXVhbCg0MDApO1xuICAgICAgICBjb25zdCByZXMgPSByZXN1bHQuYm9keTtcbiAgICAgICAgZXhwZWN0KHJlcykudG9IYXZlUHJvcGVydHkoJ21lc3NhZ2UnKTtcbiAgICAgICAgZXhwZWN0KHJlcy5tZXNzYWdlKS50b0NvbnRhaW4oJ0ludmFsaWQgcmVxdWVzdCBib2R5Jyk7XG4gICAgfSk7XG5cbiAgICBpdCgnY2Fubm90IHJldHJpZXZlIGRvY3VtZW50IHJldmlzaW9uIHdpdGggaW5jb3JyZWN0IGRpZ2VzdCB0aXAgYWRkcmVzcycsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgbSA9IF8uY2xvbmVEZWVwKHJlY2VpcHQpO1xuXG4gICAgICAgIG0uTGVkZ2VyRGlnZXN0LkRpZ2VzdFRpcEFkZHJlc3MuSW9uVGV4dCA9IFwie3N0cmFuZElkOiBcXFwiYWJjZGVmZ2hpamtsbW5vcHFzdHV2d1xcXCIsIHNlcXVlbmNlTm86IDh9XCJcblxuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByZXF1ZXN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5wb3N0KCcvcmV2aXNpb24nKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2VuZChtKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2V0KCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICBleHBlY3QocmVzdWx0LnN0YXR1c0NvZGUpLnRvRXF1YWwoNDAwKTtcbiAgICAgICAgY29uc3QgcmVzID0gcmVzdWx0LmJvZHk7XG4gICAgICAgIGV4cGVjdChyZXMpLnRvSGF2ZVByb3BlcnR5KCdtZXNzYWdlJyk7XG4gICAgICAgIGV4cGVjdChyZXMubWVzc2FnZSkudG9Db250YWluKCdDb3VsZCBub3QgZ2V0IGRvY3VtZW50IHJldmlzaW9uJyk7XG4gICAgfSk7XG5cbn0pO1xuXG5kZXNjcmliZSgnUmV0cmlldmUgaW52b2ljZSBoaXN0b3J5JywgKCkgPT4ge1xuICAgIGl0KCdjYW4gcmV0cmlldmUgMSBpbnZvaWNlIGhpc3RvcnknLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlcXVlc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmdldCgnL2hpc3RvcnknKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucXVlcnkoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5OiAnVEVTVDEwMDAxJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICBleHBlY3QocmVzdWx0LnN0YXR1c0NvZGUpLnRvRXF1YWwoMjAwKTtcbiAgICAgICAgY29uc3QgcmVzID0gcmVzdWx0LmJvZHk7XG4gICAgICAgIGV4cGVjdChBcnJheS5pc0FycmF5KHJlcykpLnRvQmUodHJ1ZSk7XG4gICAgICAgIHJlcy5mb3JFYWNoKChyOiBPYmplY3QpID0+IHtcbiAgICAgICAgICAgIGV4cGVjdChyKS50b0hhdmVQcm9wZXJ0eSgnYmxvY2tBZGRyZXNzJyk7XG4gICAgICAgICAgICBleHBlY3QocikudG9IYXZlUHJvcGVydHkoJ2hhc2gnKTtcbiAgICAgICAgICAgIGV4cGVjdChyKS50b0hhdmVQcm9wZXJ0eSgnZGF0YScpO1xuICAgICAgICAgICAgZXhwZWN0KHIpLnRvSGF2ZVByb3BlcnR5KCdtZXRhZGF0YScpO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdjYW5ub3QgcmV0cmlldmUgaGlzdG9yeSBmb3IgaW52b2ljZSB0aGF0IGRvIG5vdCBleGlzdCcsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVxdWVzdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZ2V0KCcvaGlzdG9yeScpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5xdWVyeSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk6ICdBJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICBleHBlY3QocmVzdWx0LnN0YXR1c0NvZGUpLnRvRXF1YWwoNDAwKTtcbiAgICAgICAgY29uc3QgcmVzID0gcmVzdWx0LmJvZHk7XG4gICAgICAgIGV4cGVjdChyZXMpLnRvSGF2ZVByb3BlcnR5KCdtZXNzYWdlJyk7XG4gICAgICAgIGV4cGVjdChyZXMubWVzc2FnZSkudG9Db250YWluKCdDb3VsZCBub3QgZ2V0IGhpc3RvcnknKTtcbiAgICB9KTtcblxuICAgIGl0KCdjYW5ub3QgcmV0cmlldmUgaW52b2ljZXMgd2l0aG91dCBcImtleVwiIHF1ZXJ5IHN0cmluZycsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVxdWVzdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZ2V0KCcvaGlzdG9yeScpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5xdWVyeSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXlzOiAnVEVTVDEwMDAxJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICBleHBlY3QocmVzdWx0LnN0YXR1c0NvZGUpLnRvRXF1YWwoNDAwKTtcbiAgICAgICAgY29uc3QgcmVzID0gcmVzdWx0LmJvZHk7XG4gICAgICAgIGV4cGVjdChyZXMpLnRvSGF2ZVByb3BlcnR5KCdtZXNzYWdlJyk7XG4gICAgICAgIGV4cGVjdChyZXMubWVzc2FnZSkudG9Db250YWluKCdNaXNzaW5nIHJlcXVpcmVkIHJlcXVlc3QgcGFyYW1ldGVycycpO1xuICAgIH0pO1xufSk7Il19