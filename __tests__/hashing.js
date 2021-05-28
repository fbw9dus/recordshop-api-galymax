const app = require('../app')
const request = require('supertest')
const mongoose = require('mongoose')
const User = require('../models/User')
const faker = require('faker')
const bcrypt = require("bcrypt")

let server;

describe('Hashing', () => {
    test('For new user password should be saved in hashed form', async done => {
        const fakeUser = {
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            email: faker.internet.email(),
            password: faker.internet.password(),
            role: "User"
        }
        let res = await request(app)
            .post(`/users`)
            .send(fakeUser)
        const checkUser = await User.findById(res.body._id)
        expect(checkUser.password.length).toBeGreaterThanOrEqual(1)
        expect(checkUser.password).not.toBe(fakeUser.password)
        expect(bcrypt.compare(fakeUser.password, checkUser.password)).toBeTruthy()
        done()
    })

    test('When updating password it should be saved in hashed form', async done => {
        const fakeUser = new User({
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            email: faker.internet.email(),
            password: faker.internet.password(),
            role: 'User'
        })
        await fakeUser.save()
        const fakePassword = faker.internet.password()
        const res = await request(app)
            .put(`/users/${fakeUser.id}`)
            .send({password: fakePassword})
        const checkUser = await User.findById(res.body._id)
        expect(checkUser.password.length).toBeGreaterThanOrEqual(1)
        expect(checkUser.password).not.toBe(fakePassword)
        expect(bcrypt.compare(fakePassword, checkUser.password)).toBeTruthy()
        done()
    })
})

beforeAll(async (done) => {
    server = app.listen(3000, () => {
        global.agent = request.agent(server);
        done();
    });
});
  
afterAll(async () => {
    await server.close();
    await mongoose.disconnect();
});