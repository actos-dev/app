export interface paths {
    "/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Root */
        get: operations["root__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Health */
        get: operations["health_health_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/bist/companies": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Bist Companies */
        get: operations["bist_companies_api_v1_bist_companies_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/bist/tickers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Bist Tickers */
        get: operations["bist_tickers_api_v1_bist_tickers_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/companies/search": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Search Companies */
        get: operations["search_companies_api_v1_companies_search_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/companies/info/{ticker}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Company Info */
        get: operations["company_info_api_v1_companies_info__ticker__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/companies/info/{ticker}/md": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Company Info Md */
        get: operations["company_info_md_api_v1_companies_info__ticker__md_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/companies/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Companies Summary */
        get: operations["companies_summary_api_v1_companies_summary_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/news/{ticker}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** News */
        get: operations["news_api_v1_news__ticker__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/price/history/{ticker}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Price History */
        get: operations["price_history_api_v1_price_history__ticker__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/price/current": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Current Price */
        get: operations["current_price_api_v1_price_current_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/reports/generate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Generate Report Endpoint */
        post: operations["generate_report_endpoint_api_v1_reports_generate_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/reports/info": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Report Info */
        get: operations["report_info_api_v1_reports_info_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/reports/history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Report History */
        get: operations["get_report_history_api_v1_reports_history_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/reports/search": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Search Reports */
        get: operations["search_reports_api_v1_reports_search_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/reports/{report_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Single Report */
        get: operations["get_single_report_api_v1_reports__report_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/reports/download": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Download Report */
        post: operations["download_report_api_v1_reports_download_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/stocks/fit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Fit Stocks */
        post: operations["fit_stocks_api_v1_stocks_fit_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/portfolio/profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Portfolio Profile */
        post: operations["portfolio_profile_api_v1_portfolio_profile_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/simulations/per-day-cost": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Daily Cost */
        get: operations["daily_cost_api_v1_simulations_per_day_cost_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/simulations/estimate-cost/{ticker}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Estimate Cost */
        get: operations["estimate_cost_api_v1_simulations_estimate_cost__ticker__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/simulations/history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Simulation History */
        get: operations["simulation_history_api_v1_simulations_history_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/simulations/history/{sim_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Simulation Detail */
        get: operations["simulation_detail_api_v1_simulations_history__sim_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/simulations/{ticker}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Simulate */
        get: operations["simulate_api_v1_simulations__ticker__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/economy/gold-prices": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Gold Prices */
        get: operations["gold_prices_api_v1_economy_gold_prices_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/economy/silver-price": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Silver Prices */
        get: operations["silver_prices_api_v1_economy_silver_price_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/economy/gram-platinum-price": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Gram Platinum Price */
        get: operations["gram_platinum_price_api_v1_economy_gram_platinum_price_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/economy/gram-palladium-price": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Gram Palladium Price */
        get: operations["gram_palladium_price_api_v1_economy_gram_palladium_price_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/economy/currency": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Currency */
        get: operations["currency_api_v1_economy_currency_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/macroeconomy": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Macroeconomy All */
        get: operations["macroeconomy_all_api_v1_macroeconomy_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/economy/quotes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Quotes */
        get: operations["quotes_api_v1_economy_quotes_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/economy/history/{symbol}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** History */
        get: operations["history_api_v1_economy_history__symbol__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/economy/analysis/{symbol}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Analysis */
        get: operations["analysis_api_v1_economy_analysis__symbol__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/economy/records": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Records
         * @description Record/extreme summary for every FX and metal symbol (batched, no N+1).
         */
        get: operations["records_api_v1_economy_records_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/economy/providers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Providers
         * @description Source health panel (circuit state, last errors, quota).
         */
        get: operations["providers_api_v1_economy_providers_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/ipos/upcoming": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Ipos Upcoming */
        get: operations["ipos_upcoming_api_v1_ipos_upcoming_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/ipos/draft": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Ipos Draft */
        get: operations["ipos_draft_api_v1_ipos_draft_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/ipos/active": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Ipos Active */
        get: operations["ipos_active_api_v1_ipos_active_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/ipos/{slug}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Ipos Detail */
        get: operations["ipos_detail_api_v1_ipos__slug__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/stats/top": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Stats Top */
        get: operations["stats_top_api_v1_stats_top_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/stats/{ticker}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Stats Ticker */
        get: operations["stats_ticker_api_v1_stats__ticker__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/register": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Auth Register */
        post: operations["auth_register_api_v1_auth_register_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Auth Login */
        post: operations["auth_login_api_v1_auth_login_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/verify-email": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Verify Email
         * @description E-posta dogrulama (public). Token eslesir + sure gecmemisse dogrulanmis isaretlenir.
         */
        get: operations["verify_email_api_v1_auth_verify_email_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/resend-verification": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Resend Verification
         * @description Dogrulama mailini yeniden gonderir (public, rate limited).
         *
         *     Kullanici adi VEYA e-posta alir. Hesap dogrulanmissa 400; degilse yeni
         *     token (24 saat) uretilir, DB'ye yazilir ve mail gonderilir. Mail hatalari
         *     asla 5xx uretmez: ``verification_sent: false`` ile 200 doner.
         */
        post: operations["resend_verification_api_v1_auth_resend_verification_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/refresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Auth Refresh */
        post: operations["auth_refresh_api_v1_auth_refresh_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Auth Logout */
        post: operations["auth_logout_api_v1_auth_logout_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/delete": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Auth Delete */
        delete: operations["auth_delete_api_v1_auth_delete_delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/change-password": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Change Password */
        put: operations["change_password_api_v1_auth_change_password_put"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/forgot-password": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Forgot Password
         * @description Sifre sifirlama baglantisini e-posta ile gonderir (public, rate limited).
         *
         *     Hesap var olup olmamasindan bagimsiz olarak her zaman 200 doner: hesap
         *     varligi sizintisini onlemek icin. Kullanici varsa hashed token uretilir,
         *     ``password_resets`` tablosuna yazilir ve sifirlama maili gonderilir.
         *     Mail hatalari asla 5xx uretmez (register deseni).
         */
        post: operations["forgot_password_api_v1_auth_forgot_password_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/reset-password": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Reset Password
         * @description Sifirlama token'i ile sifreyi degistirir (public).
         */
        post: operations["reset_password_api_v1_auth_reset_password_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/change-email": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Change Email */
        put: operations["change_email_api_v1_auth_change_email_put"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/change-username": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Change Username */
        put: operations["change_username_api_v1_auth_change_username_put"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Profile */
        get: operations["get_profile_api_v1_profile_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/profile/avatar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Update Avatar */
        put: operations["update_avatar_api_v1_profile_avatar_put"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/credits": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Credits Endpoint */
        get: operations["get_credits_endpoint_api_v1_credits_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/user/preferences": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Preferences */
        get: operations["get_preferences_api_v1_user_preferences_get"];
        /** Update Preferences */
        put: operations["update_preferences_api_v1_user_preferences_put"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/favorites/{ticker}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Add Favorite */
        post: operations["add_favorite_api_v1_favorites__ticker__post"];
        /** Remove Favorite */
        delete: operations["remove_favorite_api_v1_favorites__ticker__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/favorites": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Favorites */
        get: operations["get_favorites_api_v1_favorites_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/user/export": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Export User Data */
        get: operations["export_user_data_api_v1_user_export_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/legal": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Legal */
        get: operations["get_legal_api_v1_legal_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/legal/all": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get All Legal */
        get: operations["get_all_legal_api_v1_legal_all_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/about": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get About */
        get: operations["get_about_api_v1_about_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/contact": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Contact */
        get: operations["get_contact_api_v1_contact_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/version": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Version */
        get: operations["get_version_api_v1_version_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/maintenance": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Maintenance */
        get: operations["get_maintenance_api_v1_maintenance_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/analytics/event": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Analytics Event */
        post: operations["analytics_event_api_v1_analytics_event_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/announcements": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Announcements */
        get: operations["list_announcements_api_v1_announcements_get"];
        put?: never;
        /** Create New Announcement */
        post: operations["create_new_announcement_api_v1_announcements_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/announcements/{announcement_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Single Announcement */
        get: operations["get_single_announcement_api_v1_announcements__announcement_id__get"];
        /** Update Existing Announcement */
        put: operations["update_existing_announcement_api_v1_announcements__announcement_id__put"];
        post?: never;
        /** Delete Existing Announcement */
        delete: operations["delete_existing_announcement_api_v1_announcements__announcement_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/announcements/read": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Mark Announcements Read */
        post: operations["mark_announcements_read_api_v1_announcements_read_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/contributors": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Contributors */
        get: operations["get_contributors_api_v1_contributors_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/portfolios": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Portfolios */
        get: operations["list_portfolios_api_v1_portfolios_get"];
        put?: never;
        /** Create Portfolio */
        post: operations["create_portfolio_api_v1_portfolios_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/portfolios/{portfolio_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Portfolio */
        get: operations["get_portfolio_api_v1_portfolios__portfolio_id__get"];
        /** Rename Portfolio */
        put: operations["rename_portfolio_api_v1_portfolios__portfolio_id__put"];
        post?: never;
        /** Delete Portfolio */
        delete: operations["delete_portfolio_api_v1_portfolios__portfolio_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/portfolios/{portfolio_id}/duplicate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Duplicate Portfolio */
        post: operations["duplicate_portfolio_api_v1_portfolios__portfolio_id__duplicate_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/portfolios/{portfolio_id}/transactions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Transactions */
        get: operations["get_transactions_api_v1_portfolios__portfolio_id__transactions_get"];
        put?: never;
        /** Add Transaction */
        post: operations["add_transaction_api_v1_portfolios__portfolio_id__transactions_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/portfolios/{portfolio_id}/transactions/{tx_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Update Transaction */
        put: operations["update_transaction_api_v1_portfolios__portfolio_id__transactions__tx_id__put"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/portfolios/{portfolio_id}/transactions/undo": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Undo Last Transaction */
        delete: operations["undo_last_transaction_api_v1_portfolios__portfolio_id__transactions_undo_delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/portfolios/{portfolio_id}/valuation": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Portfolio Valuation */
        get: operations["portfolio_valuation_api_v1_portfolios__portfolio_id__valuation_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/portfolios/{portfolio_id}/diversification": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Portfolio Diversification */
        get: operations["portfolio_diversification_api_v1_portfolios__portfolio_id__diversification_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/portfolios/{portfolio_id}/performers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Portfolio Performers */
        get: operations["portfolio_performers_api_v1_portfolios__portfolio_id__performers_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/portfolios/{portfolio_id}/history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Portfolio History */
        get: operations["portfolio_history_api_v1_portfolios__portfolio_id__history_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/portfolios/{portfolio_id}/returns": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Portfolio Returns */
        get: operations["portfolio_returns_api_v1_portfolios__portfolio_id__returns_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/portfolios/{portfolio_id}/risk": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Portfolio Risk */
        get: operations["portfolio_risk_api_v1_portfolios__portfolio_id__risk_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/portfolios/{portfolio_id}/benchmark": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Portfolio Benchmark */
        get: operations["portfolio_benchmark_api_v1_portfolios__portfolio_id__benchmark_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/portfolios/{portfolio_id}/performance": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Portfolio Performance */
        get: operations["portfolio_performance_api_v1_portfolios__portfolio_id__performance_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/portfolios/{portfolio_id}/stats": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Portfolio Stats */
        get: operations["portfolio_stats_api_v1_portfolios__portfolio_id__stats_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/portfolios/{portfolio_id}/snapshot": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Portfolio Snapshot */
        get: operations["portfolio_snapshot_api_v1_portfolios__portfolio_id__snapshot_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/portfolios/{portfolio_id}/export/csv": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Portfolio Export Csv */
        get: operations["portfolio_export_csv_api_v1_portfolios__portfolio_id__export_csv_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/market/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Market Status
         * @description BIST acik/kapali durumu + sonraki acilis ani (public).
         */
        get: operations["market_status_api_v1_market_status_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/meta/avatars": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Avatars */
        get: operations["list_avatars_api_v1_meta_avatars_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/bots": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Bots */
        get: operations["list_bots_api_v1_bots_get"];
        put?: never;
        /** Create Bot */
        post: operations["create_bot_api_v1_bots_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/bots/{bot_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Delete Bot */
        delete: operations["delete_bot_api_v1_bots__bot_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/data/daily/{year}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Daily Data */
        get: operations["daily_data_api_v1_data_daily__year__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/data/export": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Exports */
        get: operations["list_exports_api_v1_data_export_get"];
        put?: never;
        /** Create Export */
        post: operations["create_export_api_v1_data_export_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/data/export/download/{token}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Download Export
         * @description PUBLIC indirme: token yeterli, auth yok.
         */
        get: operations["download_export_api_v1_data_export_download__token__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/data/export/{export_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Export */
        get: operations["get_export_api_v1_data_export__export_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/digest": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Read Digest
         * @description Read a market digest (see module docstring for the resolution rules).
         */
        get: operations["read_digest_api_v1_digest_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** AddTransactionBody */
        AddTransactionBody: {
            /** Ticker */
            ticker: string;
            /** Type */
            type: string;
            /** Quantity */
            quantity: number;
        };
        /** AnnouncementCreate */
        AnnouncementCreate: {
            /** Title */
            title: string;
            /** Content */
            content: string;
        };
        /** AnnouncementUpdate */
        AnnouncementUpdate: {
            /** Title */
            title: string;
            /** Content */
            content: string;
        };
        /** AvatarUpdate */
        AvatarUpdate: {
            /** Avatar Id */
            avatar_id: string;
        };
        /** Body_auth_login_api_v1_auth_login_post */
        Body_auth_login_api_v1_auth_login_post: {
            /** Grant Type */
            grant_type?: string | null;
            /** Username */
            username: string;
            /**
             * Password
             * Format: password
             */
            password: string;
            /**
             * Scope
             * @default
             */
            scope: string;
            /** Client Id */
            client_id?: string | null;
            /**
             * Client Secret
             * Format: password
             */
            client_secret?: string | null;
        };
        /** BotCreate */
        BotCreate: {
            /** Username */
            username: string;
            /** Password */
            password?: string | null;
        };
        /** ChangePassword */
        ChangePassword: {
            /** Current Password */
            current_password: string;
            /** New Password */
            new_password: string;
        };
        /** CreatePortfolioBody */
        CreatePortfolioBody: {
            /** Name */
            name: string;
            /** Initial Balance */
            initial_balance: number;
        };
        /** DuplicatePortfolioBody */
        DuplicatePortfolioBody: {
            /** Name */
            name: string;
        };
        /** ExportRequest */
        ExportRequest: {
            /**
             * Year
             * @description Veri yili (1990..simdiki yil+1)
             */
            year: number;
            /**
             * Format
             * @default csv
             * @enum {string}
             */
            format: "csv" | "json";
        };
        /** FitRequest */
        FitRequest: {
            /**
             * Horizon
             * @default long
             */
            horizon: string;
            /**
             * Profitability
             * @default high
             */
            profitability: string;
            /**
             * Risk Tolerance
             * @default medium
             */
            risk_tolerance: string;
            /**
             * Limit
             * @default 5
             */
            limit: number;
        };
        /** ForgotPassword */
        ForgotPassword: {
            /**
             * Email
             * Format: email
             */
            email: string;
        };
        /** HTTPValidationError */
        HTTPValidationError: {
            /** Detail */
            detail?: components["schemas"]["ValidationError"][];
        };
        /** PortfolioProfileRequest */
        PortfolioProfileRequest: {
            /** Tickers */
            tickers: string[];
            /**
             * Limit
             * @default 5
             */
            limit: number;
        };
        /** PreferencesUpdate */
        PreferencesUpdate: {
            /** Prefs */
            prefs: {
                [key: string]: unknown;
            };
        };
        /** RefreshRequest */
        RefreshRequest: {
            /** Refresh Token */
            refresh_token?: string | null;
        };
        /** RenamePortfolioBody */
        RenamePortfolioBody: {
            /** Name */
            name: string;
        };
        /** ReportHistoryItem */
        ReportHistoryItem: {
            /** Id */
            id: number;
            /** Ticker */
            ticker: string;
            /** Type */
            type: string;
            /** Title */
            title?: string | null;
            /** Token Usage */
            token_usage?: {
                [key: string]: unknown;
            } | null;
            /** Credits Spend */
            credits_spend?: number | null;
            /** Purpose */
            purpose?: string | null;
            /** Created At */
            created_at: string;
        };
        /** ResendVerification */
        ResendVerification: {
            /** Username Or Email */
            username_or_email: string;
        };
        /** ResetPassword */
        ResetPassword: {
            /** Token */
            token: string;
            /** New Password */
            new_password: string;
        };
        /** UpdateEmail */
        UpdateEmail: {
            /**
             * New Email
             * Format: email
             */
            new_email: string;
            /** Current Password */
            current_password: string;
        };
        /** UpdateTransactionBody */
        UpdateTransactionBody: {
            /** Price */
            price?: number | null;
            /** Quantity */
            quantity?: number | null;
        };
        /** UpdateUsername */
        UpdateUsername: {
            /** New Username */
            new_username: string;
            /** Current Password */
            current_password: string;
        };
        /** UserRegister */
        UserRegister: {
            /** Username */
            username: string;
            /**
             * Email
             * Format: email
             */
            email: string;
            /** Password */
            password: string;
        };
        /** ValidationError */
        ValidationError: {
            /** Location */
            loc: (string | number)[];
            /** Message */
            msg: string;
            /** Error Type */
            type: string;
            /** Input */
            input?: unknown;
            /** Context */
            ctx?: Record<string, never>;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    root__get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    health_health_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    bist_companies_api_v1_bist_companies_get: {
        parameters: {
            query?: {
                /** @description Sort order: alphabetical or popular */
                sort?: string;
                /** @description Number of items to skip */
                offset?: number;
                /** @description Max items to return */
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    bist_tickers_api_v1_bist_tickers_get: {
        parameters: {
            query?: {
                /** @description Sort order: alphabetical or popular */
                sort?: string;
                /** @description Number of items to skip */
                offset?: number;
                /** @description Max items to return */
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    search_companies_api_v1_companies_search_get: {
        parameters: {
            query: {
                query: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    company_info_api_v1_companies_info__ticker__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                ticker: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    company_info_md_api_v1_companies_info__ticker__md_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                ticker: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    companies_summary_api_v1_companies_summary_get: {
        parameters: {
            query?: {
                /** @description Number of companies */
                limit?: number;
                /** @description Number of items to skip */
                offset?: number;
                /** @description Sort order: popular, alphabetical, gainers, losers, price_high, price_low, volume, market_cap */
                sort?: string;
                /** @description Comma-separated ticker filter */
                tickers?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    news_api_v1_news__ticker__get: {
        parameters: {
            query?: {
                /** @description Number of news items */
                amount?: number;
            };
            header?: never;
            path: {
                ticker: string;
            };
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    price_history_api_v1_price_history__ticker__get: {
        parameters: {
            query?: {
                period?: string;
                interval?: string;
            };
            header?: never;
            path: {
                ticker: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    current_price_api_v1_price_current_get: {
        parameters: {
            query: {
                ticker: string;
                /** @description Candle interval: 5m, 30m, 1h, 1d */
                interval?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    generate_report_endpoint_api_v1_reports_generate_post: {
        parameters: {
            query: {
                ticker: string;
                type: string;
                /** @description Kullanıcının rapor amacı/sorusu */
                purpose?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    report_info_api_v1_reports_info_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    get_report_history_api_v1_reports_history_get: {
        parameters: {
            query?: {
                /** @description Sort: created_at, ticker */
                sort?: string;
                /** @description Order: asc, desc */
                order?: string;
            };
            header?: never;
            path?: never;
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReportHistoryItem"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    search_reports_api_v1_reports_search_get: {
        parameters: {
            query: {
                /** @description Search query in title and content */
                q: string;
                /** @description Sort: created_at, ticker */
                sort?: string;
                /** @description Order: asc, desc */
                order?: string;
                limit?: number;
                offset?: number;
            };
            header?: never;
            path?: never;
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReportHistoryItem"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_single_report_api_v1_reports__report_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                report_id: number;
            };
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    download_report_api_v1_reports_download_post: {
        parameters: {
            query: {
                report_id: number;
                ftype: string;
            };
            header?: never;
            path?: never;
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    fit_stocks_api_v1_stocks_fit_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["FitRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    portfolio_profile_api_v1_portfolio_profile_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PortfolioProfileRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    daily_cost_api_v1_simulations_per_day_cost_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    estimate_cost_api_v1_simulations_estimate_cost__ticker__get: {
        parameters: {
            query: {
                days: number;
            };
            header?: never;
            path: {
                ticker: string;
            };
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    simulation_history_api_v1_simulations_history_get: {
        parameters: {
            query?: {
                limit?: number;
                offset?: number;
            };
            header?: never;
            path?: never;
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    simulation_detail_api_v1_simulations_history__sim_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                sim_id: number;
            };
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    simulate_api_v1_simulations__ticker__get: {
        parameters: {
            query: {
                days: number;
                bounds?: string;
                target?: string | null;
            };
            header?: never;
            path: {
                ticker: string;
            };
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    gold_prices_api_v1_economy_gold_prices_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    silver_prices_api_v1_economy_silver_price_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    gram_platinum_price_api_v1_economy_gram_platinum_price_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    gram_palladium_price_api_v1_economy_gram_palladium_price_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    currency_api_v1_economy_currency_get: {
        parameters: {
            query?: {
                symbols?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    macroeconomy_all_api_v1_macroeconomy_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    quotes_api_v1_economy_quotes_get: {
        parameters: {
            query?: {
                symbols?: string | null;
                /** @description fx | metal */
                group?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    history_api_v1_economy_history__symbol__get: {
        parameters: {
            query?: {
                /** @description 1mo|3mo|6mo|1y|2y|5y|max */
                period?: string;
                interval?: string;
            };
            header?: never;
            path: {
                symbol: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    analysis_api_v1_economy_analysis__symbol__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                symbol: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    records_api_v1_economy_records_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    providers_api_v1_economy_providers_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    ipos_upcoming_api_v1_ipos_upcoming_get: {
        parameters: {
            query?: {
                /** @description ISO date filter (e.g. 2026-06-01T00:00:00). Defaults to last 30 days. */
                after?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    ipos_draft_api_v1_ipos_draft_get: {
        parameters: {
            query?: {
                /** @description ISO date filter. Defaults to last 30 days. */
                after?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    ipos_active_api_v1_ipos_active_get: {
        parameters: {
            query?: {
                /** @description ISO date filter. Defaults to last 30 days. */
                after?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    ipos_detail_api_v1_ipos__slug__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    stats_top_api_v1_stats_top_get: {
        parameters: {
            query?: {
                /** @description Number of top tickers */
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    stats_ticker_api_v1_stats__ticker__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                ticker: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    auth_register_api_v1_auth_register_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UserRegister"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    auth_login_api_v1_auth_login_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/x-www-form-urlencoded": components["schemas"]["Body_auth_login_api_v1_auth_login_post"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    verify_email_api_v1_auth_verify_email_get: {
        parameters: {
            query: {
                /** @description E-posta dogrulama token'i */
                token: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    resend_verification_api_v1_auth_resend_verification_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ResendVerification"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    auth_refresh_api_v1_auth_refresh_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["RefreshRequest"] | null;
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    auth_logout_api_v1_auth_logout_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["RefreshRequest"] | null;
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    auth_delete_api_v1_auth_delete_delete: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    change_password_api_v1_auth_change_password_put: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ChangePassword"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    forgot_password_api_v1_auth_forgot_password_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ForgotPassword"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    reset_password_api_v1_auth_reset_password_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ResetPassword"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    change_email_api_v1_auth_change_email_put: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateEmail"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    change_username_api_v1_auth_change_username_put: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateUsername"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_profile_api_v1_profile_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_avatar_api_v1_profile_avatar_put: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AvatarUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_credits_endpoint_api_v1_credits_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_preferences_api_v1_user_preferences_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_preferences_api_v1_user_preferences_put: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PreferencesUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    add_favorite_api_v1_favorites__ticker__post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                ticker: string;
            };
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    remove_favorite_api_v1_favorites__ticker__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                ticker: string;
            };
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_favorites_api_v1_favorites_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    export_user_data_api_v1_user_export_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_legal_api_v1_legal_get: {
        parameters: {
            query: {
                /** @description Policy name: terms, privacy_policy, cookie_policy, disclaimer */
                policy: string;
                /** @description Language: tr or en */
                lang?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_all_legal_api_v1_legal_all_get: {
        parameters: {
            query?: {
                /** @description Language: tr or en */
                lang?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_about_api_v1_about_get: {
        parameters: {
            query?: {
                /** @description Language: tr or en */
                lang?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_contact_api_v1_contact_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    get_version_api_v1_version_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    get_maintenance_api_v1_maintenance_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    analytics_event_api_v1_analytics_event_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    [key: string]: unknown;
                }[];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_announcements_api_v1_announcements_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_new_announcement_api_v1_announcements_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AnnouncementCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_single_announcement_api_v1_announcements__announcement_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                announcement_id: number;
            };
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_existing_announcement_api_v1_announcements__announcement_id__put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                announcement_id: number;
            };
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AnnouncementUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_existing_announcement_api_v1_announcements__announcement_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                announcement_id: number;
            };
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    mark_announcements_read_api_v1_announcements_read_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_contributors_api_v1_contributors_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    list_portfolios_api_v1_portfolios_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_portfolio_api_v1_portfolios_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreatePortfolioBody"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_portfolio_api_v1_portfolios__portfolio_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                portfolio_id: string;
            };
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    rename_portfolio_api_v1_portfolios__portfolio_id__put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                portfolio_id: string;
            };
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RenamePortfolioBody"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_portfolio_api_v1_portfolios__portfolio_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                portfolio_id: string;
            };
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    duplicate_portfolio_api_v1_portfolios__portfolio_id__duplicate_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                portfolio_id: string;
            };
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DuplicatePortfolioBody"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_transactions_api_v1_portfolios__portfolio_id__transactions_get: {
        parameters: {
            query?: {
                ticker?: string | null;
                tx_type?: string | null;
                start?: string | null;
                end?: string | null;
            };
            header?: never;
            path: {
                portfolio_id: string;
            };
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    add_transaction_api_v1_portfolios__portfolio_id__transactions_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                portfolio_id: string;
            };
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AddTransactionBody"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_transaction_api_v1_portfolios__portfolio_id__transactions__tx_id__put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                portfolio_id: string;
                tx_id: string;
            };
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateTransactionBody"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    undo_last_transaction_api_v1_portfolios__portfolio_id__transactions_undo_delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                portfolio_id: string;
            };
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    portfolio_valuation_api_v1_portfolios__portfolio_id__valuation_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                portfolio_id: string;
            };
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    portfolio_diversification_api_v1_portfolios__portfolio_id__diversification_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                portfolio_id: string;
            };
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    portfolio_performers_api_v1_portfolios__portfolio_id__performers_get: {
        parameters: {
            query?: {
                top_n?: number;
            };
            header?: never;
            path: {
                portfolio_id: string;
            };
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    portfolio_history_api_v1_portfolios__portfolio_id__history_get: {
        parameters: {
            query?: {
                period?: string;
            };
            header?: never;
            path: {
                portfolio_id: string;
            };
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    portfolio_returns_api_v1_portfolios__portfolio_id__returns_get: {
        parameters: {
            query?: {
                period?: string;
            };
            header?: never;
            path: {
                portfolio_id: string;
            };
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    portfolio_risk_api_v1_portfolios__portfolio_id__risk_get: {
        parameters: {
            query?: {
                period?: string;
            };
            header?: never;
            path: {
                portfolio_id: string;
            };
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    portfolio_benchmark_api_v1_portfolios__portfolio_id__benchmark_get: {
        parameters: {
            query?: {
                ticker?: string;
            };
            header?: never;
            path: {
                portfolio_id: string;
            };
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    portfolio_performance_api_v1_portfolios__portfolio_id__performance_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                portfolio_id: string;
            };
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    portfolio_stats_api_v1_portfolios__portfolio_id__stats_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                portfolio_id: string;
            };
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    portfolio_snapshot_api_v1_portfolios__portfolio_id__snapshot_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                portfolio_id: string;
            };
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    portfolio_export_csv_api_v1_portfolios__portfolio_id__export_csv_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                portfolio_id: string;
            };
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "text/plain": string;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    market_status_api_v1_market_status_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    list_avatars_api_v1_meta_avatars_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    list_bots_api_v1_bots_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_bot_api_v1_bots_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BotCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_bot_api_v1_bots__bot_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                bot_id: number;
            };
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    daily_data_api_v1_data_daily__year__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                year: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_exports_api_v1_data_export_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_export_api_v1_data_export_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ExportRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    download_export_api_v1_data_export_download__token__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                token: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_export_api_v1_data_export__export_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                export_id: number;
            };
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    read_digest_api_v1_digest_get: {
        parameters: {
            query?: {
                /** @description YYYY-MM-DD digest date */
                date?: string | null;
                /** @description digest slot (requires date) */
                slot?: ("morning" | "noon" | "evening") | null;
                /** @description ISO8601 datetime; returns the digest whose slot window covers it */
                at?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: {
                access_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
}
