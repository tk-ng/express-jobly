"use strict";

const request = require("supertest");

const app = require("../app");

const {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
	testJobIds,
	u1Token,
	adminToken,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
	const newJob = {
		title: "new",
		salary: 10000,
		equity: "0.065",
		companyHandle: "c1",
	};

	test("ok for admin", async function () {
		const resp = await request(app)
			.post("/jobs")
			.send(newJob)
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(201);
		expect(resp.body).toEqual({
			job: { ...newJob, id: expect.any(Number) },
		});
	});

	test("unauth for non-admin", async function () {
		const resp = await request(app)
			.post("/jobs")
			.send(newJob)
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(401);
	});

	test("bad request with missing data", async function () {
		const resp = await request(app)
			.post("/jobs")
			.send({
				title: "new",
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(400);
	});

	test("bad request with invalid data", async function () {
		const resp = await request(app)
			.post("/jobs")
			.send({
				...newJob,
				salary: -1,
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(400);
	});
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
	test("ok for anon", async function () {
		const resp = await request(app).get("/jobs");
		expect(resp.body).toEqual({
			jobs: [
				{
					id: expect.any(Number),
					title: "J1",
					salary: 1,
					equity: "0.1",
					companyHandle: "c1",
					companyName: "C1",
				},
				{
					id: expect.any(Number),
					title: "J2",
					salary: 2,
					equity: "0.2",
					companyHandle: "c1",
					companyName: "C1",
				},
				{
					id: expect.any(Number),
					title: "J3",
					salary: 3,
					equity: null,
					companyHandle: "c1",
					companyName: "C1",
				},
			],
		});
	});

	test("works: filtering", async function () {
		const resp = await request(app).get("/jobs").query({ minSalary: 3 });
		expect(resp.body).toEqual({
			jobs: [
				{
					id: expect.any(Number),
					title: "J3",
					salary: 3,
					equity: null,
					companyHandle: "c1",
					companyName: "C1",
				},
			],
		});
	});

	test("works: filtering on all filters", async function () {
		const resp = await request(app)
			.get("/jobs")
			.query({ title: "j3", minSalary: 3, hasEquity: "false" });
		expect(resp.body).toEqual({
			jobs: [
				{
					id: expect.any(Number),
					title: "J3",
					salary: 3,
					equity: null,
					companyHandle: "c1",
					companyName: "C1",
				},
			],
		});
	});

	test("bad request if invalid filter key", async function () {
		const resp = await request(app)
			.get("/jobs")
			.query({ minSalary: 2, nope: "nope" });
		expect(resp.statusCode).toEqual(400);
	});
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
	test("works for anon", async function () {
		const resp = await request(app).get(`/jobs/${testJobIds[0]}`);
		expect(resp.body).toEqual({
			job: {
				id: testJobIds[0],
				title: "J1",
				salary: 1,
				equity: "0.1",
				company: {
					handle: "c1",
					name: "C1",
					description: "Desc1",
					numEmployees: 1,
					logoUrl: "http://c1.img",
				},
			},
		});
	});

	test("not found for no such job", async function () {
		const resp = await request(app).get(`/jobs/0`);
		expect(resp.statusCode).toEqual(404);
	});
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
	test("works for admin", async function () {
		const resp = await request(app)
			.patch(`/jobs/${testJobIds[0]}`)
			.send({
				title: "J1-new",
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.body).toEqual({
			job: {
				id: testJobIds[0],
				title: "J1-new",
				salary: 1,
				equity: "0.1",
				companyHandle: "c1",
			},
		});
	});

	test("unauth for non-admin", async function () {
		const resp = await request(app)
			.patch(`/jobs/${testJobIds[0]}`)
			.send({
				title: "J1-new-new",
			})
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(401);
	});

	test("unauth for anon", async function () {
		const resp = await request(app).patch(`/jobs/${testJobIds[0]}`).send({
			name: "J1-new",
		});
		expect(resp.statusCode).toEqual(401);
	});

	test("not found on no such job", async function () {
		const resp = await request(app)
			.patch(`/jobs/0`)
			.send({
				title: "new nope",
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(404);
	});

	test("bad request on id change attempt", async function () {
		const resp = await request(app)
			.patch(`/jobs/${testJobIds[0]}`)
			.send({
				id: 999,
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(400);
	});

	test("bad request on companyHandle change attempt", async function () {
		const resp = await request(app)
			.patch(`/jobs/${testJobIds[0]}`)
			.send({
				companyHandle: "c2",
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(400);
	});

	test("bad request on invalid data", async function () {
		const resp = await request(app)
			.patch(`/jobs/${testJobIds[0]}`)
			.send({
				salary: -1,
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(400);
	});
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
	test("works for admin", async function () {
		const resp = await request(app)
			.delete(`/jobs/${testJobIds[0]}`)
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.body).toEqual({ deleted: testJobIds[0] });
	});

	test("unauth for non-admin", async function () {
		const resp = await request(app)
			.delete(`/jobs/${testJobIds[1]}`)
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(401);
	});

	test("unauth for anon", async function () {
		const resp = await request(app).delete(`/jobs/${testJobIds[1]}`);
		expect(resp.statusCode).toEqual(401);
	});

	test("not found for no such job", async function () {
		const resp = await request(app)
			.delete(`/jobs/0`)
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(404);
	});
});
