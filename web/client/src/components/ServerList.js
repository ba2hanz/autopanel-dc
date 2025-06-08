import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ServerList = () => {
    const navigate = useNavigate();
    const [servers, setServers] = useState([]);

    useEffect(() => {
        fetchServers();
    }, []);

    const fetchServers = async () => {
        try {
            const response = await fetch('/api/servers');
            const data = await response.json();
            setServers(data);
        } catch (error) {
            console.error('Error fetching servers:', error);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {servers.map(server => (
                <div
                    key={server._id}
                    className="bg-[#23232b] rounded-2xl shadow-lg border border-[#23232b] hover:border-[#3a3a45] transition-all duration-200 flex flex-col justify-between min-h-[180px]"
                >
                    <div className="p-5 flex items-center gap-4">
                        {server.icon ? (
                            <img
                                src={`https://cdn.discordapp.com/icons/${server.guildId}/${server.icon}.png`}
                                alt={server.name}
                                className="w-14 h-14 rounded-xl shadow-md border border-[#23232b]"
                            />
                        ) : (
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-700 flex items-center justify-center shadow-md border border-[#23232b]">
                                <span className="text-xl font-bold text-white">
                                    {server.name.charAt(0)}
                                </span>
                            </div>
                        )}
                        <div className="flex flex-col">
                            <span className="text-base font-semibold text-white mb-1 truncate max-w-[160px]">{server.name}</span>
                            <span className="text-xs text-gray-400">{server.memberCount} üye</span>
                            <span className={`text-xs mt-1 ${server.needsBot ? 'text-red-400' : 'text-green-400'}`}>{server.needsBot ? 'Bot Yok' : 'Bot Var'}</span>
                        </div>
                    </div>
                    <div className="px-5 pb-5 mt-auto">
                        {server.needsBot ? (
                            <a
                                href={`https://discord.com/api/oauth2/authorize?client_id=${process.env.REACT_APP_DISCORD_CLIENT_ID}&permissions=8&scope=bot%20applications.commands&guild_id=${server.guildId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full inline-block text-center py-2.5 rounded-xl font-medium text-sm bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transition-colors duration-200 shadow"
                            >
                                Davet Et
                            </a>
                        ) : (
                            <button
                                onClick={() => navigate(`/dashboard/${server.guildId}`)}
                                className="w-full py-2.5 rounded-xl font-medium text-sm bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800 transition-colors duration-200 shadow"
                            >
                                Yönet
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ServerList; 