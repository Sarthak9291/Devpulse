const prisma = require("../config/prisma")
const fetch = require("node-fetch")
const generateGithubUrl = (token) => {

    return `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=read:user repo&state=${encodeURIComponent(token)}`;
};
const exchangeCodeForToken = async (code) => {
    const response = await fetch(
        "https://github.com/login/oauth/access_token",
        {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code
            })
        }
    );

    const data = await response.json();

    if (!data.access_token) {
        throw new Error(
            "Failed to get GitHub access token"
        );
    }

    return data.access_token;
};
const getGithubUser = async (token) => {
    const response = await fetch(
        "https://api.github.com/user",
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    const data = await response.json();

    if (!data.id) {
        throw new Error(
            "Failed to fetch GitHub user"
        );
    }

    return data;
};

const connectGithub = async (userId, githubUser,token) => {
    
    const user=await prisma.user.update({
        where: {
            id: userId
        },
            data: {
                githubId: String(githubUser.id),
                githubUsername: githubUser.login,
                githubAccessToken: token
            }
    })
    return user
}

module.exports = {
    generateGithubUrl,
    exchangeCodeForToken,
    getGithubUser,
    connectGithub
}