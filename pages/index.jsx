import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Profile from "./Profile";

import PostRequest from "./PostRequest";

import AvailableJobs from "./AvailableJobs";

import JobDetails from "./JobDetails";

import MyJobs from "./MyJobs";

import Chat from "./Chat";

import Messages from "./Messages";

import Agreement from "./Agreement";

import Notifications from "./Notifications";

import PayHistory from "./PayHistory";

import Landing from "./Landing";

import Admin from "./Admin";

import ApplicationDetail from "./ApplicationDetail";

import UserEdit from "./UserEdit";

import HowItWorks from "./HowItWorks";

import FAQ from "./FAQ";

import Portfolio from "./Portfolio";

import ReportProblem from "./ReportProblem";

import SupportTickets from "./SupportTickets";

import TermsOfService from "./TermsOfService";

import UserReports from "./UserReports";

import ProfileSaved from "./ProfileSaved";

import TodaysJobs from "./TodaysJobs";

import AppealSubmitted from "./AppealSubmitted";

import ProfileUpdated from "./ProfileUpdated";

import HowToUseApp from "./HowToUseApp";

import AdminMessageUser from "./AdminMessageUser";

import StateAnalytics from "./StateAnalytics";

import Analytics from "./Analytics";

import Reviews from "./Reviews";

import AdminSupport from "./AdminSupport";

import SupportChatView from "./SupportChatView";

import SupportChatUser from "./SupportChatUser";

import DirectMessageChat from "./DirectMessageChat";

import Invitations from "./Invitations";

import AdminChat from "./AdminChat";

import AdminActivity from "./AdminActivity";

import SimulateUser from "./SimulateUser";

import AdminGuide from "./AdminGuide";

import About from "./About";

import PrivacyPolicy from "./PrivacyPolicy";

import UserAgreement from "./UserAgreement";

import Help from "./Help";

import AccountSettings from "./AccountSettings";

import InstallApp from "./InstallApp";

import EditRequest from "./EditRequest";

import MyApplications from "./MyApplications";

import PublicProfile from "./PublicProfile";

import AdminAIChat from "./AdminAIChat";

import UserAIChat from "./UserAIChat";

import VerificationRequest from "./VerificationRequest";

import AllUsers from "./AllUsers";

import Pricing from "./Pricing";

import RefundPolicy from "./RefundPolicy";

import SubscriptionAdmin from "./SubscriptionAdmin";

import SubscriptionHistory from "./SubscriptionHistory";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Profile: Profile,
    
    PostRequest: PostRequest,
    
    AvailableJobs: AvailableJobs,
    
    JobDetails: JobDetails,
    
    MyJobs: MyJobs,
    
    Chat: Chat,
    
    Messages: Messages,
    
    Agreement: Agreement,
    
    Notifications: Notifications,
    
    PayHistory: PayHistory,
    
    Landing: Landing,
    
    Admin: Admin,
    
    ApplicationDetail: ApplicationDetail,
    
    UserEdit: UserEdit,
    
    HowItWorks: HowItWorks,
    
    FAQ: FAQ,
    
    Portfolio: Portfolio,
    
    ReportProblem: ReportProblem,
    
    SupportTickets: SupportTickets,
    
    TermsOfService: TermsOfService,
    
    UserReports: UserReports,
    
    ProfileSaved: ProfileSaved,
    
    TodaysJobs: TodaysJobs,
    
    AppealSubmitted: AppealSubmitted,
    
    ProfileUpdated: ProfileUpdated,
    
    HowToUseApp: HowToUseApp,
    
    AdminMessageUser: AdminMessageUser,
    
    StateAnalytics: StateAnalytics,
    
    Analytics: Analytics,
    
    Reviews: Reviews,
    
    AdminSupport: AdminSupport,
    
    SupportChatView: SupportChatView,
    
    SupportChatUser: SupportChatUser,
    
    DirectMessageChat: DirectMessageChat,
    
    Invitations: Invitations,
    
    AdminChat: AdminChat,
    
    AdminActivity: AdminActivity,
    
    SimulateUser: SimulateUser,
    
    AdminGuide: AdminGuide,
    
    About: About,
    
    PrivacyPolicy: PrivacyPolicy,
    
    UserAgreement: UserAgreement,
    
    Help: Help,
    
    AccountSettings: AccountSettings,
    
    InstallApp: InstallApp,
    
    EditRequest: EditRequest,
    
    MyApplications: MyApplications,
    
    PublicProfile: PublicProfile,
    
    AdminAIChat: AdminAIChat,
    
    UserAIChat: UserAIChat,
    
    VerificationRequest: VerificationRequest,
    
    AllUsers: AllUsers,
    
    Pricing: Pricing,
    
    RefundPolicy: RefundPolicy,
    
    SubscriptionAdmin: SubscriptionAdmin,
    
    SubscriptionHistory: SubscriptionHistory,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Profile" element={<Profile />} />
                
                <Route path="/PostRequest" element={<PostRequest />} />
                
                <Route path="/AvailableJobs" element={<AvailableJobs />} />
                
                <Route path="/JobDetails" element={<JobDetails />} />
                
                <Route path="/MyJobs" element={<MyJobs />} />
                
                <Route path="/Chat" element={<Chat />} />
                
                <Route path="/Messages" element={<Messages />} />
                
                <Route path="/Agreement" element={<Agreement />} />
                
                <Route path="/Notifications" element={<Notifications />} />
                
                <Route path="/PayHistory" element={<PayHistory />} />
                
                <Route path="/Landing" element={<Landing />} />
                
                <Route path="/Admin" element={<Admin />} />
                
                <Route path="/ApplicationDetail" element={<ApplicationDetail />} />
                
                <Route path="/UserEdit" element={<UserEdit />} />
                
                <Route path="/HowItWorks" element={<HowItWorks />} />
                
                <Route path="/FAQ" element={<FAQ />} />
                
                <Route path="/Portfolio" element={<Portfolio />} />
                
                <Route path="/ReportProblem" element={<ReportProblem />} />
                
                <Route path="/SupportTickets" element={<SupportTickets />} />
                
                <Route path="/TermsOfService" element={<TermsOfService />} />
                
                <Route path="/UserReports" element={<UserReports />} />
                
                <Route path="/ProfileSaved" element={<ProfileSaved />} />
                
                <Route path="/TodaysJobs" element={<TodaysJobs />} />
                
                <Route path="/AppealSubmitted" element={<AppealSubmitted />} />
                
                <Route path="/ProfileUpdated" element={<ProfileUpdated />} />
                
                <Route path="/HowToUseApp" element={<HowToUseApp />} />
                
                <Route path="/AdminMessageUser" element={<AdminMessageUser />} />
                
                <Route path="/StateAnalytics" element={<StateAnalytics />} />
                
                <Route path="/Analytics" element={<Analytics />} />
                
                <Route path="/Reviews" element={<Reviews />} />
                
                <Route path="/AdminSupport" element={<AdminSupport />} />
                
                <Route path="/SupportChatView" element={<SupportChatView />} />
                
                <Route path="/SupportChatUser" element={<SupportChatUser />} />
                
                <Route path="/DirectMessageChat" element={<DirectMessageChat />} />
                
                <Route path="/Invitations" element={<Invitations />} />
                
                <Route path="/AdminChat" element={<AdminChat />} />
                
                <Route path="/AdminActivity" element={<AdminActivity />} />
                
                <Route path="/SimulateUser" element={<SimulateUser />} />
                
                <Route path="/AdminGuide" element={<AdminGuide />} />
                
                <Route path="/About" element={<About />} />
                
                <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
                
                <Route path="/UserAgreement" element={<UserAgreement />} />
                
                <Route path="/Help" element={<Help />} />
                
                <Route path="/AccountSettings" element={<AccountSettings />} />
                
                <Route path="/InstallApp" element={<InstallApp />} />
                
                <Route path="/EditRequest" element={<EditRequest />} />
                
                <Route path="/MyApplications" element={<MyApplications />} />
                
                <Route path="/PublicProfile" element={<PublicProfile />} />
                
                <Route path="/AdminAIChat" element={<AdminAIChat />} />
                
                <Route path="/UserAIChat" element={<UserAIChat />} />
                
                <Route path="/VerificationRequest" element={<VerificationRequest />} />
                
                <Route path="/AllUsers" element={<AllUsers />} />
                
                <Route path="/Pricing" element={<Pricing />} />
                
                <Route path="/RefundPolicy" element={<RefundPolicy />} />
                
                <Route path="/SubscriptionAdmin" element={<SubscriptionAdmin />} />
                
                <Route path="/SubscriptionHistory" element={<SubscriptionHistory />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}