const githubService = require("../services/githubService")
const {verifyAccessToken} = require("../utils/tokenUtils")
const githubLogin = async (req, res) => {

    const token =
        req.headers.authorization
            .split(" ")[1];

    const url =
        githubService.generateGithubUrl(token);

    return res.json({
    url
});
};

const githubCallback = async (req,res) => {
    const code =req.query.code;
    const stateToken =req.query.state;
    if (!code) {
        return res.status(400).json({
            success: false,
            message:"Authorization code missing"
        });
    }
    if (!stateToken) {
    return res.status(400).json({
        success: false,
        message: "State token missing"
    });
}
    try {
        const decoded =
            verifyAccessToken(
                stateToken
            );
        const userId =decoded.id;
        const token =await githubService.exchangeCodeForToken(code);
        const githubUser =await githubService.getGithubUser(token);
        const githubConnection =await githubService.connectGithub(userId,githubUser,token);
        const {
                    password,
                    githubAccessToken,
                    ...safeUser
                } = safeUser;
        return res.status(200).json({
            success: true,
            message:"GitHub connected successfully",
            data: githubConnection
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message:"Error occurred while connecting to GitHub"
        });
    }
};
const getGithubUserRepos = async (req,res) => {
    const token =
        req.headers.authorization.split(" ")[1];
    try {
        const decoded =
            verifyAccessToken(
                token
            );
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

const linkGithubRepository = async (req,res) => {
    try{
    const repoid = req.params.repoId;
    const linkrepo= await githubService.linkGithubRepository(req.user.id,repoid,req.body);
    return res.status(200).json({
        success: true,
        message: "Repository linked successfully",
        data: linkrepo
    });}
    catch(error){
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
    linkGithubRepository
}