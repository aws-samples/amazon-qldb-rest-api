const APIGW_ENDPOINT= process.env.APIGW_ENDPOINT || 'https://1yqzhex0t1.execute-api.ap-southeast-1.amazonaws.com/prod';
const request = require('supertest')(APIGW_ENDPOINT);
const _ = require('lodash');
const util = require('util');

const templateInvoice = {
    "key": "TO_BE_FILLED",
    "value": {
        "date": "2021-05-22",
        "billTo": "ABC Car Dealer Pte Ltd",
        "carInfo": {
            "model": "Honda",
            "make": "Jazz",
            "year": 2021,
            "unitPrice": 89000
        },
        "quantity": 10
    }
}

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
        expect(Array.isArray(res)).toBe(true);
        res.forEach((r: Object) => {
            expect(r).toHaveProperty('documentId');
            expect(r).toHaveProperty('txId');
        });
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
        //TODO: Once array in array issue is fixed
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
