import { useState, useEffect } from 'react';
import { Save, Github, ExternalLink, RefreshCw, Sparkles, BookOpen, Terminal, Zap, Shield, Server, Code } from 'lucide-react';
import { request as invoke } from '../utils/request';
import { open } from '@tauri-apps/plugin-dialog';
import { useConfigStore } from '../stores/useConfigStore';
import { AppConfig } from '../types/config';
import ModalDialog from '../components/common/ModalDialog';
import { showToast } from '../components/common/ToastContainer';

import { useTranslation } from 'react-i18next';

function Settings() {
    const { t } = useTranslation();
    const { config, loadConfig, saveConfig } = useConfigStore();
    const [activeTab, setActiveTab] = useState<'general' | 'account' | 'proxy' | 'advanced' | 'about'>('general');
    const [formData, setFormData] = useState<AppConfig>({
        language: 'en',
        theme: 'system',
        auto_refresh: false,
        refresh_interval: 15,
        auto_sync: false,
        sync_interval: 5,
        proxy: {
            enabled: false,
            port: 8080,
            api_key: '',
            auto_start: false,
            request_timeout: 120,
            enable_logging: false,
            upstream_proxy: {
                enabled: false,
                url: ''
            }
        }
    });

    // Dialog state
    // Dialog state
    const [isClearLogsOpen, setIsClearLogsOpen] = useState(false);
    const [dataDirPath, setDataDirPath] = useState<string>('~/.antigravity_tools/');

    // Update check state
    const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
    const [_updateInfo, setUpdateInfo] = useState<{
        hasUpdate: boolean;
        latestVersion: string;
        currentVersion: string;
        downloadUrl: string;
    } | null>(null);

    useEffect(() => {
        loadConfig();

        // 获取真实数据目录路径
        invoke<string>('get_data_dir_path')
            .then(path => setDataDirPath(path))
            .catch(err => console.error('Failed to get data dir:', err));
    }, [loadConfig]);

    useEffect(() => {
        if (config) {
            setFormData(config);
        }
    }, [config]);

    const handleSave = async () => {
        try {
            await saveConfig(formData);
            showToast(t('common.saved'), 'success');
        } catch (error) {
            showToast(`${t('common.error')}: ${error}`, 'error');
        }
    };

    const confirmClearLogs = async () => {
        try {
            await invoke('clear_log_cache');
            showToast(t('settings.advanced.logs_cleared'), 'success');
        } catch (error) {
            showToast(`${t('common.error')}: ${error}`, 'error');
        }
        setIsClearLogsOpen(false);
    };

    const handleOpenDataDir = async () => {
        try {
            await invoke('open_data_folder');
        } catch (error) {
            showToast(`${t('common.error')}: ${error}`, 'error');
        }
    };

    const handleSelectExportPath = async () => {
        try {
            // @ts-ignore
            const selected = await open({
                directory: true,
                multiple: false,
                title: t('settings.advanced.export_path'),
            });
            if (selected && typeof selected === 'string') {
                setFormData({ ...formData, default_export_path: selected });
            }
        } catch (error) {
            showToast(`${t('common.error')}: ${error}`, 'error');
        }
    };

    const handleSelectAntigravityPath = async () => {
        try {
            const selected = await open({
                directory: false,
                multiple: false,
                title: t('settings.advanced.antigravity_path_select'),
            });
            if (selected && typeof selected === 'string') {
                setFormData({ ...formData, antigravity_executable: selected });
            }
        } catch (error) {
            showToast(`${t('common.error')}: ${error}`, 'error');
        }
    };


    const handleDetectAntigravityPath = async () => {
        try {
            const path = await invoke<string>('get_antigravity_path', { bypassConfig: true });
            setFormData({ ...formData, antigravity_executable: path });
            showToast(t('settings.advanced.antigravity_path_detected'), 'success');
        } catch (error) {
            showToast(`${t('common.error')}: ${error}`, 'error');
        }
    };

    const handleCheckUpdate = async () => {
        setIsCheckingUpdate(true);
        setUpdateInfo(null);
        try {
            const result = await invoke<{
                has_update: boolean;
                latest_version: string;
                current_version: string;
                download_url: string;
            }>('check_for_updates');

            setUpdateInfo({
                hasUpdate: result.has_update,
                latestVersion: result.latest_version,
                currentVersion: result.current_version,
                downloadUrl: result.download_url,
            });

            if (result.has_update) {
                showToast(t('settings.about.new_version_available', { version: result.latest_version }), 'info');
            } else {
                showToast(t('settings.about.latest_version'), 'success');
            }
        } catch (error) {
            showToast(`${t('settings.about.update_check_failed')}: ${error}`, 'error');
        } finally {
            setIsCheckingUpdate(false);
        }
    };

    return (
        <div className="h-full w-full overflow-y-auto">
            <div className="p-5 space-y-4 max-w-7xl mx-auto">
                {/* 顶部工具栏：Tab 导航和保存按钮 */}
                <div className="flex justify-between items-center">
                    {/* Tab 导航 - 采用顶部导航栏样式：外层灰色容器 */}
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-base-200 rounded-full p-1 w-fit">
                        <button
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'general'
                                ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                            onClick={() => setActiveTab('general')}
                        >
                            {t('settings.tabs.general')}
                        </button>
                        <button
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'account'
                                ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                            onClick={() => setActiveTab('account')}
                        >
                            {t('settings.tabs.account')}
                        </button>
                        <button
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'proxy'
                                ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                            onClick={() => setActiveTab('proxy')}
                        >
                            {t('settings.tabs.proxy')}
                        </button>
                        <button
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'advanced'
                                ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                            onClick={() => setActiveTab('advanced')}
                        >
                            {t('settings.tabs.advanced')}
                        </button>
                        <button
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'about'
                                ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                            onClick={() => setActiveTab('about')}
                        >
                            {t('settings.tabs.about')}
                        </button>
                    </div>

                    <button
                        className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-sm"
                        onClick={handleSave}
                    >
                        <Save className="w-4 h-4" />
                        {t('settings.save')}
                    </button>
                </div>

                {/* 设置表单 */}
                <div className="bg-white dark:bg-base-100 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-base-200">
                    {/* General Settings */}
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-base-content">{t('settings.general.title')}</h2>

                            {/* Theme Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-900 dark:text-base-content mb-2">{t('settings.general.theme')}</label>
                                <select
                                    className="w-full px-4 py-4 border border-gray-200 dark:border-base-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-base-content bg-gray-50 dark:bg-base-200"
                                    value={formData.theme}
                                    onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                                >
                                    <option value="light">{t('settings.general.theme_light')}</option>
                                    <option value="dark">{t('settings.general.theme_dark')}</option>
                                    <option value="system">{t('settings.general.theme_system')}</option>
                                </select>
                            </div>

                            {/* 开机自动启动 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-900 dark:text-base-content mb-2">{t('settings.general.auto_launch')}</label>
                                <select
                                    className="w-full px-4 py-4 border border-gray-200 dark:border-base-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-base-content bg-gray-50 dark:bg-base-200"
                                    value={formData.auto_launch ? 'enabled' : 'disabled'}
                                    onChange={async (e) => {
                                        const enabled = e.target.value === 'enabled';
                                        try {
                                            await invoke('toggle_auto_launch', { enable: enabled });
                                            setFormData({ ...formData, auto_launch: enabled });
                                            showToast(enabled ? 'Auto-launch enabled' : 'Auto-launch disabled', 'success');
                                        } catch (error) {
                                            showToast(`${t('common.error')}: ${error}`, 'error');
                                        }
                                    }}
                                >
                                    <option value="disabled">{t('settings.general.auto_launch_disabled')}</option>
                                    <option value="enabled">{t('settings.general.auto_launch_enabled')}</option>
                                </select>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t('settings.general.auto_launch_desc')}</p>
                            </div>
                        </div>
                    )}

                    {/* 账号设置 */}
                    {activeTab === 'account' && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-base-content">{t('settings.account.title')}</h2>

                            {/* 自动刷新配额 */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-base-200 rounded-lg border border-gray-100 dark:border-base-300">
                                <div>
                                    <div className="font-medium text-gray-900 dark:text-base-content">{t('settings.account.auto_refresh')}</div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('settings.account.auto_refresh_desc')}</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={formData.auto_refresh}
                                        onChange={(e) => setFormData({ ...formData, auto_refresh: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 dark:bg-base-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                                </label>
                            </div>

                            {/* 刷新间隔 */}
                            {formData.auto_refresh && (
                                <div className="ml-4">
                                    <label className="block text-sm font-medium text-gray-900 dark:text-base-content mb-2">{t('settings.account.refresh_interval')}</label>
                                    <input
                                        type="number"
                                        className="w-32 px-4 py-4 border border-gray-200 dark:border-base-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-base-content bg-gray-50 dark:bg-base-200"
                                        min="1"
                                        max="60"
                                        value={formData.refresh_interval}
                                        onChange={(e) => setFormData({ ...formData, refresh_interval: parseInt(e.target.value) })}
                                    />
                                </div>
                            )}

                            {/* 自动获取当前账号 */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-base-200 rounded-lg border border-gray-100 dark:border-base-300">
                                <div>
                                    <div className="font-medium text-gray-900 dark:text-base-content">{t('settings.account.auto_sync')}</div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('settings.account.auto_sync_desc')}</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={formData.auto_sync}
                                        onChange={(e) => setFormData({ ...formData, auto_sync: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 dark:bg-base-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                                </label>
                            </div>

                            {/* 同步间隔 */}
                            {formData.auto_sync && (
                                <div className="ml-4">
                                    <label className="block text-sm font-medium text-gray-900 dark:text-base-content mb-2">{t('settings.account.sync_interval')}</label>
                                    <input
                                        type="number"
                                        className="w-32 px-4 py-4 border border-gray-200 dark:border-base-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-base-content bg-gray-50 dark:bg-base-200"
                                        min="1"
                                        max="60"
                                        value={formData.sync_interval}
                                        onChange={(e) => setFormData({ ...formData, sync_interval: parseInt(e.target.value) })}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* 高级设置 */}
                    {activeTab === 'advanced' && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-base-content">{t('settings.advanced.title')}</h2>

                            {/* 默认导出路径 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-900 dark:text-base-content mb-1">{t('settings.advanced.export_path')}</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="flex-1 px-4 py-4 border border-gray-200 dark:border-base-300 rounded-lg bg-gray-50 dark:bg-base-200 text-gray-900 dark:text-base-content font-medium"
                                        value={formData.default_export_path || t('settings.advanced.export_path_placeholder')}
                                        readOnly
                                    />
                                    {formData.default_export_path && (
                                        <button
                                            className="px-4 py-2 border border-gray-200 dark:border-base-300 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                            onClick={() => setFormData({ ...formData, default_export_path: undefined })}
                                        >
                                            {t('common.clear')}
                                        </button>
                                    )}
                                    <button
                                        className="px-4 py-2 border border-gray-200 dark:border-base-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-base-200 hover:text-gray-900 dark:hover:text-base-content transition-colors"
                                        onClick={handleSelectExportPath}
                                    >
                                        {t('settings.advanced.select_btn')}
                                    </button>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t('settings.advanced.default_export_path_desc')}</p>
                            </div>

                            {/* 数据目录 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-900 dark:text-base-content mb-1">{t('settings.advanced.data_dir')}</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="flex-1 px-4 py-4 border border-gray-200 dark:border-base-300 rounded-lg bg-gray-50 dark:bg-base-200 text-gray-900 dark:text-base-content font-medium"
                                        value={dataDirPath}
                                        readOnly
                                    />
                                    <button
                                        className="px-4 py-2 border border-gray-200 dark:border-base-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-base-200 hover:text-gray-900 dark:hover:text-base-content transition-colors"
                                        onClick={handleOpenDataDir}
                                    >
                                        {t('settings.advanced.open_btn')}
                                    </button>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t('settings.advanced.data_dir_desc')}</p>
                            </div>

                            {/* 反重力程序路径 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-900 dark:text-base-content mb-1">
                                    {t('settings.advanced.antigravity_path')}
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="flex-1 px-4 py-4 border border-gray-200 dark:border-base-300 rounded-lg bg-gray-50 dark:bg-base-200 text-gray-900 dark:text-base-content font-medium"
                                        value={formData.antigravity_executable || ''}
                                        placeholder={t('settings.advanced.antigravity_path_placeholder')}
                                        onChange={(e) => setFormData({ ...formData, antigravity_executable: e.target.value })}
                                    />
                                    {formData.antigravity_executable && (
                                        <button
                                            className="px-4 py-2 border border-gray-200 dark:border-base-300 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                            onClick={() => setFormData({ ...formData, antigravity_executable: undefined })}
                                        >
                                            {t('common.clear')}
                                        </button>
                                    )}
                                    <button
                                        className="px-4 py-2 border border-gray-200 dark:border-base-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-base-200 transition-colors"
                                        onClick={handleDetectAntigravityPath}
                                    >
                                        {t('settings.advanced.detect_btn')}
                                    </button>
                                    <button
                                        className="px-4 py-2 border border-gray-200 dark:border-base-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-base-200 transition-colors"
                                        onClick={handleSelectAntigravityPath}
                                    >
                                        {t('settings.advanced.select_btn')}
                                    </button>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                    {t('settings.advanced.antigravity_path_desc')}
                                </p>
                            </div>

                            {/* 反重力程序启动参数 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-900 dark:text-base-content mb-1">
                                    {t('settings.advanced.antigravity_args')}
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="flex-1 px-4 py-4 border border-gray-200 dark:border-base-300 rounded-lg bg-gray-50 dark:bg-base-200 text-gray-900 dark:text-base-content font-medium"
                                        value={formData.antigravity_args ? formData.antigravity_args.join(' ') : ''}
                                        placeholder={t('settings.advanced.antigravity_args_placeholder')}
                                        onChange={(e) => {
                                            const args = e.target.value.trim() === '' ? [] : e.target.value.split(' ').map(arg => arg.trim()).filter(arg => arg !== '');
                                            setFormData({ ...formData, antigravity_args: args });
                                        }}
                                    />
                                    <button
                                        className="px-4 py-2 border border-gray-200 dark:border-base-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-base-200 transition-colors"
                                        onClick={async () => {
                                            try {
                                                const args = await invoke<string[]>('get_antigravity_args');
                                                setFormData({ ...formData, antigravity_args: args });
                                                showToast(t('settings.advanced.antigravity_args_detected'), 'success');
                                            } catch (error) {
                                                showToast(`${t('settings.advanced.antigravity_args_detect_error')}: ${error}`, 'error');
                                            }
                                        }}
                                    >
                                        {t('settings.advanced.detect_args_btn')}
                                    </button>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                    {t('settings.advanced.antigravity_args_desc')}
                                </p>
                            </div>

                            <div className="border-t border-gray-200 dark:border-base-200 pt-4">
                                <h3 className="font-medium text-gray-900 dark:text-base-content mb-3">{t('settings.advanced.logs_title')}</h3>
                                <div className="bg-gray-50 dark:bg-base-200 border border-gray-200 dark:border-base-300 rounded-lg p-3 mb-3">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('settings.advanced.logs_desc')}</p>
                                </div>
                                <div className="badge badge-primary badge-outline gap-2 font-mono">
                                    v3.3.15
                                </div>
                                <div className="flex items-center gap-4">
                                    <button
                                        className="px-4 py-2 border border-gray-300 dark:border-base-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-base-200 transition-colors"
                                        onClick={() => setIsClearLogsOpen(true)}
                                    >
                                        {t('settings.advanced.clear_logs')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 代理设置 */}
                    {activeTab === 'proxy' && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-base-content">{t('settings.proxy.title')}</h2>

                            <div className="p-4 bg-gray-50 dark:bg-base-200 rounded-lg border border-gray-100 dark:border-base-300">
                                <h3 className="text-md font-semibold text-gray-900 dark:text-base-content mb-3 flex items-center gap-2">
                                    <Sparkles size={18} className="text-blue-500" />
                                    {t('proxy.config.upstream_proxy.title')}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    {t('proxy.config.upstream_proxy.desc')}
                                </p>

                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <label className="flex items-center cursor-pointer gap-3">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only"
                                                    checked={formData.proxy?.upstream_proxy?.enabled || false}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        proxy: {
                                                            ...formData.proxy,
                                                            upstream_proxy: {
                                                                ...formData.proxy.upstream_proxy,
                                                                enabled: e.target.checked
                                                            }
                                                        }
                                                    })}
                                                />
                                                <div className={`block w-14 h-8 rounded-full transition-colors ${formData.proxy?.upstream_proxy?.enabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-base-300'}`}></div>
                                                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${formData.proxy?.upstream_proxy?.enabled ? 'transform translate-x-6' : ''}`}></div>
                                            </div>
                                            <span className="text-sm font-medium text-gray-900 dark:text-base-content">
                                                {t('proxy.config.upstream_proxy.enable')}
                                            </span>
                                        </label>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {t('proxy.config.upstream_proxy.url')}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.proxy?.upstream_proxy?.url || ''}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                proxy: {
                                                    ...formData.proxy,
                                                    upstream_proxy: {
                                                        ...formData.proxy.upstream_proxy,
                                                        url: e.target.value
                                                    }
                                                }
                                            })}
                                            placeholder={t('proxy.config.upstream_proxy.url_placeholder')}
                                            className="w-full px-4 py-4 border border-gray-200 dark:border-base-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-base-content bg-gray-50 dark:bg-base-200"
                                        />
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            {t('proxy.config.upstream_proxy.tip')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'about' && (
                        <div className="flex flex-col h-full animate-in fade-in duration-500 overflow-y-auto">
                            {/* Header with Logo and Version */}
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-base-300">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-lg"></div>
                                        <img
                                            src="/logo.svg"
                                            alt="G-ZERO Logo"
                                            className="relative w-14 h-14 rounded-2xl shadow-lg"
                                        />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-base-content">Gravity Zero</h2>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium text-xs">
                                                v1.0.0
                                            </span>
                                            <span className="text-gray-400">G-ZERO</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCheckUpdate}
                                    disabled={isCheckingUpdate}
                                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg text-sm flex items-center gap-2"
                                >
                                    <RefreshCw className={`w-4 h-4 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                                    {isCheckingUpdate ? t('settings.about.checking_update') : t('settings.about.check_update')}
                                </button>
                            </div>

                            {/* Quick Start Guide */}
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-base-content flex items-center gap-2 mb-3">
                                        <BookOpen className="w-5 h-5 text-blue-500" />
                                        Quick Start Guide
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Step 1 */}
                                        <div className="p-4 bg-gray-50 dark:bg-base-200 rounded-xl border border-gray-100 dark:border-base-300">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">1</span>
                                                <span className="font-medium text-gray-900 dark:text-base-content">Add Accounts</span>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Go to Accounts tab and add your Google accounts via OAuth or Refresh Token.</p>
                                        </div>
                                        {/* Step 2 */}
                                        <div className="p-4 bg-gray-50 dark:bg-base-200 rounded-xl border border-gray-100 dark:border-base-300">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">2</span>
                                                <span className="font-medium text-gray-900 dark:text-base-content">Start API Proxy</span>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Go to API Proxy tab and click "Start Service" to enable the local proxy.</p>
                                        </div>
                                        {/* Step 3 */}
                                        <div className="p-4 bg-gray-50 dark:bg-base-200 rounded-xl border border-gray-100 dark:border-base-300">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">3</span>
                                                <span className="font-medium text-gray-900 dark:text-base-content">Configure Client</span>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Set your AI client to use http://127.0.0.1:8045 as the API endpoint.</p>
                                        </div>
                                        {/* Step 4 */}
                                        <div className="p-4 bg-gray-50 dark:bg-base-200 rounded-xl border border-gray-100 dark:border-base-300">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">4</span>
                                                <span className="font-medium text-gray-900 dark:text-base-content">Start Using</span>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Use your favorite AI tools with automatic account rotation and quota management.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Integration Examples */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-base-content flex items-center gap-2 mb-3">
                                        <Terminal className="w-5 h-5 text-green-500" />
                                        Integration Examples
                                    </h3>
                                    <div className="space-y-3">
                                        {/* Claude Code CLI */}
                                        <div className="p-4 bg-gray-900 dark:bg-gray-950 rounded-xl">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Code className="w-4 h-4 text-purple-400" />
                                                <span className="text-sm font-medium text-gray-200">Claude Code CLI</span>
                                            </div>
                                            <pre className="text-xs text-green-400 font-mono overflow-x-auto">
{`export ANTHROPIC_API_KEY="sk-gzero"
export ANTHROPIC_BASE_URL="http://127.0.0.1:8045"
claude`}
                                            </pre>
                                        </div>
                                        {/* Python */}
                                        <div className="p-4 bg-gray-900 dark:bg-gray-950 rounded-xl">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Code className="w-4 h-4 text-yellow-400" />
                                                <span className="text-sm font-medium text-gray-200">Python (OpenAI SDK)</span>
                                            </div>
                                            <pre className="text-xs text-green-400 font-mono overflow-x-auto">
{`client = openai.OpenAI(
    api_key="sk-gzero",
    base_url="http://127.0.0.1:8045/v1"
)`}
                                            </pre>
                                        </div>
                                    </div>
                                </div>

                                {/* Features */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-base-content flex items-center gap-2 mb-3">
                                        <Zap className="w-5 h-5 text-yellow-500" />
                                        Key Features
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div className="p-3 bg-gray-50 dark:bg-base-200 rounded-lg text-center">
                                            <Server className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                                            <span className="text-xs text-gray-600 dark:text-gray-400">Multi-Protocol</span>
                                        </div>
                                        <div className="p-3 bg-gray-50 dark:bg-base-200 rounded-lg text-center">
                                            <Shield className="w-5 h-5 text-green-500 mx-auto mb-1" />
                                            <span className="text-xs text-gray-600 dark:text-gray-400">Auto Rotation</span>
                                        </div>
                                        <div className="p-3 bg-gray-50 dark:bg-base-200 rounded-lg text-center">
                                            <Zap className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                                            <span className="text-xs text-gray-600 dark:text-gray-400">Smart Caching</span>
                                        </div>
                                        <div className="p-3 bg-gray-50 dark:bg-base-200 rounded-lg text-center">
                                            <RefreshCw className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                                            <span className="text-xs text-gray-600 dark:text-gray-400">Rate Limiting</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Links */}
                                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-base-300">
                                    <div className="flex gap-3">
                                        <div className="px-3 py-1 bg-gray-100 dark:bg-base-200 rounded-lg text-xs font-medium text-gray-500">
                                            Tauri v2
                                        </div>
                                        <div className="px-3 py-1 bg-gray-100 dark:bg-base-200 rounded-lg text-xs font-medium text-gray-500">
                                            React 19
                                        </div>
                                        <div className="px-3 py-1 bg-gray-100 dark:bg-base-200 rounded-lg text-xs font-medium text-gray-500">
                                            TypeScript
                                        </div>
                                    </div>
                                    <a
                                        href="https://github.com/gzero/gravity-zero"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                    >
                                        <Github className="w-4 h-4" />
                                        <span>{t('settings.about.view_code')}</span>
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>

                                <div className="text-center text-[10px] text-gray-300 dark:text-gray-600 pt-2">
                                    {t('settings.about.copyright')}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <ModalDialog
                    isOpen={isClearLogsOpen}
                    title={t('settings.advanced.clear_logs_title')}
                    message={t('settings.advanced.clear_logs_msg')}
                    type="confirm"
                    confirmText={t('common.clear')}
                    cancelText={t('common.cancel')}
                    isDestructive={true}
                    onConfirm={confirmClearLogs}
                    onCancel={() => setIsClearLogsOpen(false)}
                />
            </div>
        </div>
    );
}

export default Settings;
