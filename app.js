
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
try {
    const localEnvVars = require(__dirname + "/localEnvVars.js");
    localEnvVars.load();
} catch (err) {
}

const app = express();
const port = 3000;
const url = `mongodb+srv://${process.env.mongoUser}:${process.env.mongoPass}@cluster0.zmamtu8.mongodb.net/dailyJournalDB`;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

const blogSchema = new mongoose.Schema({
    header: String,
    body: String
});
const Blog = mongoose.model('Blog', blogSchema);

const entrySchema = new mongoose.Schema({
    header: String,
    body: String
}, {
    methods: {
        bodyPreview() {
            return this.body.slice(0, 128) + (this.body.length > 128 ? "..." : "");
        }
    }
});
const Entry = mongoose.model('Entry', entrySchema);

async function connectDB() {
    try {
        // console.log(url);
        await mongoose.connect(url);
        console.log('Connected to DB');
    } catch (err) {
        console.log(err);
    }
}
connectDB();

async function initBlog() {
    try {
        const blog = new Blog({
            header: "Home",
            body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Mattis molestie a iaculis at erat pellentesque. Nisi porta lorem mollis aliquam ut porttitor leo a. Sollicitudin nibh sit amet commodo nulla. Id eu nisl nunc mi ipsum faucibus. Volutpat lacus laoreet non curabitur gravida arcu ac. Mauris in aliquam sem fringilla ut morbi. Neque egestas congue quisque egestas diam in arcu. Enim ut tellus elementum sagittis vitae et. Volutpat lacus laoreet non curabitur gravida arcu ac tortor dignissim."
        });
        await Blog.insertMany([blog]);
        console.log('initBlog()');
    } catch (err) {
        console.log(err);
    }
}

app.get('/', (req, res) => {
    Blog.find().exec().then(blogs => {
        if (blogs.length == 0) {
            initBlog().then(() => {
                res.redirect('/');
            });
        } else {
            Entry.find().exec().then(entries => {
                res.render('index', {blog: blogs[0], entries: entries});
            })
        }
    });
});

app.post('/', (req, res) => {
    const entry = new Entry({
        header: req.body.title,
        body: req.body.post
    });
    Entry.insertMany([entry]).then(() => 
        res.redirect('/')
    );
});

app.get('/posts/:entryID', (req, res) => {
    let entry = {
        header: 'Error',
        body: 'Post not found :('
    };
    try {
        Entry.find({
            _id: new mongoose.Types.ObjectId(req.params.entryID.trim())
        }).exec().then(entries => {
            if (entries.length > 0) {
                entry = entries[0];
            }
            res.render('entry', { entry: entry });
        });
    } catch (err) {
        res.render('entry', { entry: entry });
    }
});

app.get('/compose', (req, res) => {
    res.render('compose', {});
});

app.get('/about', (req, res) => {
    res.render('about', {});
});

app.get('/contact', (req, res) => {
    res.render('contact', {});
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
