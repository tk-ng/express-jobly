const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");

describe("sqlForPartialUpdate", function () {
	test("convert to query string", function () {
		const data = {
			name: "testCompany",
			description: "testDesc",
			numEmployees: 100,
			logoUrl: "www.test.com",
		};
		const jsToSql = { numEmployees: "num_employees", logoUrl: "logo_url" };
		const result = sqlForPartialUpdate(data, jsToSql);
		expect(result).toEqual({
			setCols: expect.any(String),
			values: expect.any(Array),
		});
		expect(result.setCols).toEqual(
			`"name"=$1, "description"=$2, "num_employees"=$3, "logo_url"=$4`
		);
		expect(result.values).toEqual(Object.values(data));
	});

	test("Throws BadRequestError with invalid data", function () {
		expect(() => sqlForPartialUpdate({}, { logoUrl: "logo_url" })).toThrow(
			BadRequestError
		);
	});
});
