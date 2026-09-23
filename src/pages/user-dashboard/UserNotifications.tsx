import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { NotificationList } from "@/components/szlif/NotificationList";

/**
 * The client's notifications. All three panels render the same list; only the
 * role guard and the heading differ, so the page is the guard and the heading.
 */
const UserNotifications = () => {
    useRequireAuth({ allowedRoles: ["client"] });
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

export default UserNotifications;
