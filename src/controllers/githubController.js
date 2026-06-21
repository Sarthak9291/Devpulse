const githubService = require("../services/githubService")
const {verifyAccessToken} = require("../utils/tokenUtils")

const githubLogin = async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const url = githubService.generateGithubUrl(token);
    return res.json({ url });
};

const githubCallback = async (req, res) => {
    const code = req.query.code;
    const stateToken = req.query.state;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    if (!code) {
        return res.redirect(`${frontendUrl}/?github_error=Authorization code missing`);
    }
    if (!stateToken) {
        return res.redirect(`${frontendUrl}/?github_error=State token missing`);
    }

    try {
        const decoded = verifyAccessToken(stateToken);
        const userId = decoded.id;
        const token = await githubService.exchangeCodeForToken(code);
        const githubUser = await githubService.getGithubUser(token);
        await githubService.connectGithub(userId, githubUser, token);
        
        return res.redirect(`${frontendUrl}/?github_success=GitHub connected successfully&username=${githubUser.login}`);
    } catch (error) {
        console.error(error);
        return res.redirect(`${frontendUrl}/?github_error=Error occurred while connecting to GitHub`);
    }
};

const getGithubStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const status = await githubService.getGithubStatus(userId);
        return res.status(200).json({
            success: true,
            ...status
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Error occurred while getting GitHub connection status"
        });
    }
};

const getGithubUserRepos = async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    try {
        const decoded = verifyAccessToken(token);
        const userId = decoded.id;
        const repositories = await githubService.getGithubUserRepos(userId);
        return res.status(200).json({
            success: true,
            message: "Repositories fetched successfully",
            data: repositories
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Error occurred while fetching GitHub repositories"
        });
    }
};

const linkGithubRepository = async (req, res) => {
    try {
        const repoid = req.params.repoId;
        const linkrepo = await githubService.linkGithubRepository(req.user.id, repoid, req.body);
        return res.status(200).json({
            success: true,
            message: "Repository linked successfully",
            data: linkrepo
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Error occurred while linking GitHub repository"
        });
    }
};

module.exports = {
    githubLogin,
    githubCallback,
    getGithubUserRepos,
    linkGithubRepository,
    getGithubStatus
}