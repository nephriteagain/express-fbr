
export const route = {
    get: (req, res) => {
        console.log(req.path)
        return res.sendStatus(200)
    },
    post: (req, res) => {
        console.log(req.path)
        return res.sendStatus(200)
    }
}