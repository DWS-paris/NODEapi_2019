/* 
Import
*/
    // NodeJS
    require('dotenv').config();
    const express = require('express');
    const bodyParser = require('body-parser');
    const path = require('path');
    const ejs = require('ejs');

    // Services
    const mongoDB = require('./services/db.connect');
//


/* 
Config
*/
    // Declarations
    const server = express();
    const apiRouter = express.Router({ mergeParams: true });
    const frontRouter = express.Router({ mergeParams: true });
    const Models = require('./models/index');
    const port = process.env.PORT    

    // Server class
    class ServerClass{
        init(){
            // View engine configuration
            server.engine( 'html', ejs.renderFile );
            server.set('view engine', 'html');

            // Static path configuration
            server.set( 'views', __dirname + '/www' );
            server.use( express.static(path.join(__dirname, 'www')) );

            //=> Body-parser
            server.use(bodyParser.json({limit: '10mb'}));
            server.use(bodyParser.urlencoded({ extended: true }));


            //=> Set routers
            server.use('/api', apiRouter);
            server.use('/', frontRouter);

            // Start server
            this.launch();
        };

        frontRoutes(){
            /**
             * Route to display front page
             * @param path: String => any endpoints
            */
            frontRouter.get( '/*', (req, res) => res.render('index') );
        };

        apiRoutes(){
            /**
             * Route to create new item
             * @param path: String => api endpoint
             * @param body: Object => mandatory data
            */
            apiRouter.post('/:endpoint/', (req, res) => {
                // Check request body
                if (
                    req.body.email === undefined &&
                    req.body.username === undefined &&
                    req.body.password === undefined
    
                ) { return res.status(400).json({ message: 'Bad data provided', data: null }) }
               
                else{
                    Models[ req.params['endpoint'] ].findOne({email: req.body.email}, (error, item) => {
                        // Request error
                        if(error) { return res.status(400).json({ message: 'Network error', data: null}) }
                        else if(item) { return res.status(400).json({ message: 'Item not new', data: null}) }
                        else {
                            // Save item in DB
                            Models[ req.params['endpoint'] ].create(req.body)
                            .then( response => res.status(200).send({ message: 'Object created', data: response }))
                            .catch( response => res.status(500).send({ message: 'Request error', data: null }))
                        };
                    });
                };
            });
    
            /**
             * Route to get item data by _id
             * @param path: String => api endpoint
             * @param id: String => selected objet id
            */
            apiRouter.get('/:endpoint/:id', (req, res) => {
                Models[ req.params['endpoint'] ].findById(req.params.id, (error, item) => {
                    if(error) { return res.status(400).json({ message: 'Network error', data: null}) }
                    else if(item) { return res.status(200).send({ message: 'Object data sended', data: item }) }
                });
            });
    
            /**
             * Route to get all item data
             * @param path: String => api endpoint
            */
            apiRouter.get('/:endpoint/', (req, res) => {
                Models[ req.params['endpoint'] ].find((error, items) => {
                    if(error) { return res.status(400).json({ message: 'Network error', data: null}) }
                    else if(items) { return res.status(200).send({ message: 'Objects data sended', data: items }) }
                });
            });
    
            /**
             * Route to update item data by _id
             * @param path: String => api endpoint
             * @param id: String => selected objet id
            */
            apiRouter.put('/:endpoint/:id', (req, res) => {
                // Check request body
                if (
                    req.body.email === undefined &&
                    req.body.username === undefined &&
                    req.body.password === undefined
    
                ) { return res.status(400).json({ message: 'No data provided', data: null }) }
               
                else{
                    Models[ req.params['endpoint'] ].findByIdAndUpdate(req.params.id, {$set: req.body}, (error, item) => {
                        if(error) { return res.status(400).json({ message: 'Network error', data: null}) }
                        else if(item) { return res.status(200).send({ message: 'Object updated', data: req.params.id }) }
                    });
                }
            });
    
            /**
             * Route to delete item by _id
             * @param path: String => api endpoint
             * @param id: String => selected objet id
            */
            apiRouter.delete('/:endpoint/:id', (req, res) => {
                Models[ req.params['endpoint'] ].findByIdAndDelete({_id: req.params.id}, (error, item) => {
                    if(error) { return res.status(400).json({ message: 'Network error', data: null}) }
                    else if(item) { return res.status(200).send({ message: 'Object deleted', data: req.params.id }) }
                });
            });
        };

        launch(){
            // Init Routers
            this.frontRoutes();
            this.apiRoutes();

            // Connect MongoDB
            mongoDB.initClient()
            .then( mongooseResponse => {
                // Launch server
                server.listen(port, () => console.log({ database: mongooseResponse, server: `http://localhost:${port}` }))
            })
            .catch( mongooseError => console.log(mongooseError));
        };
    };
//


/* 
Start
*/
    new ServerClass().init();
//