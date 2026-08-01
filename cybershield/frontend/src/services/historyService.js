import API from "../api/api";

export const getRepositoryHistory = async (repository) => {
    const res = await API.get("/github/history", {
        params: { repository }
    });

    return res.data;
};

export const getHistoryStatistics = async (repository) => {
    const res = await API.get("/github/history/statistics", {
        params: { repository }
    });

    return res.data;
};

export const getHistoryReport = async (scanId) => {
    const res = await API.get(`/github/history/${scanId}`);
    return res.data;
};