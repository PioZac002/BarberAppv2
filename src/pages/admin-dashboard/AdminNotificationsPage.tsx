import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { NotificationList } from "@/components/szlif/NotificationList";

/** The administrator's notifications — the shared list behind the admin guard. */
const AdminNotificationsPage = () => {
    useRequireAuth({ allowedRoles: ["admin"] });
    const { t } = useLanguage();

    return (
        <section>
            <div className="rule-double mb-6 pb-3">
                <h2 className="section-head text-xl">{t("dashboard.notifications")}</h2>
            </div>
            <NotificationList />
        </section>
    );
};

export default AdminNotificationsPage;
