/**
 * Created by david2099 on 20/01/19.
 */

class ErrorController {

    constructor(app) {
        this.app = app;
        this.notFound();
        this.catchErrors();
    }

    notFound () {
        this.app.use((req, res) => {
            const error = new Error('404: Resource Not Found');
            error.status = 404;
            res.json({"error": error.message});
        });
    }

    catchErrors () {
        this.app.use((error, req, res, next) => {
            res.status(error.status || 500).json({"error": error.message, "status": error.status});
        });
    }

}

module.exports = (app) => { return new ErrorController(app);}