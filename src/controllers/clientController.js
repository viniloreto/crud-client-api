const express = require('express');
const neo4j = require('neo4j-driver');

const router = express.Router();
const driver = neo4j.driver('bolt://54.174.97.221:33104', neo4j.auth.basic('neo4j', 'transits-configurations-energy'));


router.get('/allClients', (req, res) => {
    const session = driver.session();
    const clients = [];

    const page = req.query.page;
    let limit = null;
    let skip = null;

    //If page = null return all Clients
    if(page) {
        limit = parseInt(req.query.limit) || 10;
        if(page === 1) {
            skip = 0;
        }else {
            skip = limit * (page - 1); ;
        }
    }

    let query = 'MATCH (u:Client) WITH COUNT(u) AS totalClients MATCH (u:Client) \
                    RETURN totalClients, u';
    
    if(skip){
        query += ` SKIP $skipValue` 
    }
    if(limit){
        query += ` LIMIT $limitValue` 
    }

    session
        .run(query, {skipValue: skip, limitValue: limit})
        .then((result) => {
            result.records.forEach( client => {
                clients.push({
                    name: client._fields[1].properties.name,
                    cpf: client._fields[1].properties.cpf,
                    country: client._fields[1].properties.country,
                    email: client._fields[1].properties.email,
                    age: client._fields[1].properties.age,
                    id: client._fields[1].identity.low
                })
            })

            const totalClients = result.records.length > 0 ? result.records[0]._fields[0].low : 0;
            res.send({ clients, totalClients });
            session.close();
        })
        .catch((err) => {
            session.close();
            res.status(500).send({
                Error: err.message
            })
        })
})

router.post('/addClient', (req, res) => {
    const session = driver.session();
    const name = req.body.name;
    const country = req.body.country;
    const age= req.body.age;
    const email = req.body.email;
    const cpf = req.body.cpf;

    session
        .run('CREATE (n:Client { name: $clientName, country: $clientCountry, \
                age: $clientAge, email:$clientEmail, cpf: $clientCpf })',
            {
                clientName: name, 
                clientCountry: country, 
                clientAge: age, 
                clientEmail: email, 
                clientCpf: cpf 
            })
        .then(() => {
            res.send({
                message: 'REGISTER CREATED'
            });
        })
        .catch((err) => {
            res.status(500).send({
                Error: err.message
            })
        })
})

router.delete('/deleteClient', (req, res) => {
    const session = driver.session();
    const id = req.query.id;

    session
        .run(`MATCH (n:Client) WHERE id(n) = ${id} DELETE n`)
        .then((s) => {
            session.close();
            res.send({
                message: 'REGISTER DELETED'
            });
        })
        .catch(err => {
            session.close();
            res.status(500).send({
                Error: err.message
            })
        })
})

router.put('/editClient', (req, res) => {
    const session = driver.session();

    const name = req.body.name;
    const country = req.body.country;
    const age= req.body.age;
    const email = req.body.email;
    const cpf = req.body.cpf;
    const id = req.body.id;

    session
        .run('MATCH (n:Client) WHERE id(n) = $clientId SET n.name = $clientName, \
                n.country = $clientCountry, n.age = $clientAge, n.email = $clientEmail, \
                n.cpf = $clientCpf',
            { 
                clientId: id, 
                clientName: name,
                clientCountry: country,
                clientAge: age,
                clientEmail: email,
                clientCpf: cpf 
            })
        .then(() => {
            session.close();
            res.send({
                message: 'REGISTER UPDATED',
            });
        })
        .catch((err) => {
            session.close();
            res.status(500).send({
                Error: err.message
            })
        })
})

module.exports = app => app.use('/clients', router);