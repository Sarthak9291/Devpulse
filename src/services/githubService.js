const prisma = require("../config/prisma")
const {Membership} = require("../utils/repoutils")
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
                Authorization: `Bearer ${token}`,
                "User-Agent": "DevPulse-App",
                Accept: "application/vnd.github+json"
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

const getGithubUserRepos = async (userId) => {
    const user = await prisma.user.findUnique({
        where: {
            id: userId
        }
    });
    if (!user) {
        throw new Error("User not found");
    }
    const token = user.githubAccessToken;
    if (!token) {
        throw new Error(
            "GitHub account not connected"
        );
    }

    let repositories = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 10) {
        const response = await fetch(
            `https://api.github.com/user/repos?per_page=100&page=${page}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/vnd.github+json",
                    "User-Agent": "DevPulse-App"
                }
            }
        );

        if (!response.ok) {
            throw new Error("Failed to fetch repositories from GitHub");
        }

        const data = await response.json();
        if (data.length === 0) {
            hasMore = false;
        } else {
            repositories = repositories.concat(data);
            if (data.length < 100) {
                hasMore = false;
            } else {
                page++;
            }
        }
    }

    return repositories;
};

const getGithubStatus = async (userId) => {
    const user = await prisma.user.findUnique({
        where: {
            id: userId
        },
        select: {
            githubAccessToken: true,
            githubUsername: true
        }
    });
    if (!user) {
        throw new Error("User not found");
    }
    return {
        connected: !!user.githubAccessToken,
        username: user.githubUsername || null
    };
};

const linkGithubRepository = async (
    userId,
    repoId,
    githubRepoData
) => {

    const repository =
        await prisma.repository.findUnique({
            where: {
                id: Number(repoId)
            }
        });

    if (!repository) {
        throw new Error("Repository not found");
    }

    await Membership(
        userId,
        repository.organizationId
    );

    const linkedRepository =
        await prisma.repository.update({
            where: {
                id: Number(repoId)
            },
            data: {
                githubRepoId:
                    String(githubRepoData.githubRepoId),

                githubRepoName:
                    githubRepoData.githubRepoName,

                githubRepoUrl:
                    githubRepoData.githubRepoUrl
            }
        });

    return linkedRepository;
};
module.exports = {
    generateGithubUrl,
    exchangeCodeForToken,
    getGithubUser,
    connectGithub,
    getGithubUserRepos,
    linkGithubRepository,
    getGithubStatus
}