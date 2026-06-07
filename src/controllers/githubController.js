const githubService = require("../services/githubService")

const githubLogin = async (req,res) => {
    const url =
        githubService.generateGithubUrl();

    return res.redirect(url);
}

const githubCallback = async (req, res) => {
    const code = req.query.code;
    if (!code) {
        return res.status(400).json({
            success: false,
            message: "Authorization code missing"
        });
    }
    try{
        const token=await githubService.exchangeCodeForToken(code);
        const githubUser=await githubService.getGithubUser(token);
        const githubConnection=await githubService.connectGithub(req.user.id, githubUser, token)
        res.status(200).json({
            success: true,
            message: "GitHub connected successfully",
            data: githubConnection
        });
    } catch (error) {
        console.error("Error in GitHub callback:", error);
        res.status(500).json({
            success: false,
            message: "Error occurred while connecting to GitHub"
        });
    }
}

module.exports = {
    githubLogin,
    githubCallback
}