import fs from "node:fs"
import path from "path"

const file = fs.readdirSync("../app", {recursive: true})

let express = `const express = require('express');
const app = express();
const port = 3000;

app.listen(port, () => {
    console.log("port is running on port", port)
});
`

const METHODS = [
    "get",
    "head",
    "post",
    "put",
    "delete",
    "connect",
    "options",
    "trace",
    "patch",
]

function getRouteName(path) {
    if (path === '/' || path === '') return 'app';

    const parts = path.split('/').filter(Boolean); // remove empty strings
    for (const part of parts) {
        if (!part.startsWith(':')) {
            return part;
        }
    }

    return 'app'; // fallback if all parts are dynamic
}


async function parseRoutes(file) {
    const routes = [{name: 'app', value: ``}]
    for (const f of file) {
        /** this means the module is not a valid route */
        if (!f.endsWith("route.js")) continue;
        console.log(`reading file: ${f}`)
        const module = await import(`../app/${f}`)
        const route = module.route
        /** incorrect type for the route object */
        if (typeof route !== "object") {
            throw new Error("invalid route type, route must be an object")
        }
        const path = `/${f.replace(/\/?route\.js$/, "")}`;
        const routeName = getRouteName(path)
        let currentRoute = routes.find(r => r.name === routeName)
        if (!currentRoute)  {
            routes.push({name: routeName, value: `\n
const ${routeName} = app.Router();
                `})
        }
        currentRoute = routes.find(r => r.name === routeName)
        if (!currentRoute)  {
            throw new Error("route name not ofund")
        }
        /** ignores non rest methods */
        for (const method in route) {
            if (METHODS.includes(method)) {
                console.log(`${method} in ${f}`)
                if (Array.isArray(route[method])) {
                    const fnStrArr = route[method].map(fn => fn.toString())
                    const fnStr = fnStrArr.join(",\n")
                    currentRoute.value = currentRoute.value.concat(`\n
${routeName}.${method}("${path}",\n${fnStr}\n);`
                        )
                } else {
                    currentRoute.value = currentRoute.value.concat(`\n
${routeName}.${method}("${path}",\n${route[method].toString()}\n);`
                        )
                }

            }
        }
    }
    for (const r of routes)  {
        express = express.concat(`\n
${r.value}
            `)
    }
}

console.log(file)

await parseRoutes(file)



const dist = '../dist';
try {
if (!fs.existsSync(dist)) {
    fs.mkdirSync(dist);   
}
fs.writeFileSync(
    path.join(dist, "index.js"),
    express,
    "utf-8"
)
} catch (err) {
console.error(err);
}