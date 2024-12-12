const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.
/** Generate the `column = $n` part of the query string with `dataToUpdate`.
 *
 * dataToUpdate can include: {name, description, numEmployees, logoUrl}
 *
 * jsToSql includes {key_name: column_name} for keys that have a different
 * name than the columns.
 *
 *
 * jsToSql example: {numEmployees: "num_employees", logoUrl: "logo_url",}
 *
 * Returns {setCols, values}
 *
 * setCols example: `"name"=$1, "description"=$2, "numEmployees"=$3, "logoUrl"=$4`
 *
 * Throws BadRequestError if dataToUpdate is empty.
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
	const keys = Object.keys(dataToUpdate);
	if (keys.length === 0) throw new BadRequestError("No data");

	// {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
	const cols = keys.map(
		(colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
	);

	return {
		setCols: cols.join(", "),
		values: Object.values(dataToUpdate),
	};
}

module.exports = { sqlForPartialUpdate };
