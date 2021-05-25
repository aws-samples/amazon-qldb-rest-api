## The story

A car manufacturer sells cars to the car dealers and needs a secure way to share the invoices. The invoice is digital so that it can be re-printed and verified by those who have access to a REST API on top of the Amazon QLDB service and know it's unique ID. The process is the following:

1. The car manufacturer issues an invoice to a car dealer through their REST API
2. The car manufacturer sends the invoice and its "receipt" to a car dealer over email
3. The car dealer gets the invoice and its "receipt" and verifies it with the car dealer's REST API to make sure it was not modified during transfer
4. The car dealer performs bank transfer and includes the id and the version of the invoice into the details
5. The car manufacturer gets the details of the transfer from their bank, retrieves the history of the invoice with the REST API finds the correct version to make sure the right version was used as a reference for payment
6. If car manufacturer finds the details in the version of the invoice not matching with the bank transfer, they may ask the car dealer to provide the "receipt" as a proof
7. The car manufacturer updates the invoice marking it as "PAID" and sends the final version with its "receipt" to the car dealer
8. The car dealer can retrieve the whole history of the invoice with the REST API and validate the latest version with the "receipt"