import React from 'react';
import { FaRightFromBracket } from 'react-icons/fa6';
import { useMathGamePick } from '../store/mathGameBridgeStore.js';
import AdminBrand from './admin/AdminBrand.jsx';
import '../styles/ClassroomTransitions.css';

const SiblingCheckModal = () => {
    const { 
        showSiblingCheck, 
        loginPendingName, 
        handleSiblingCheck 
    } = useMathGamePick((ctx) => ({
        showSiblingCheck: Boolean(ctx.showSiblingCheck),
        loginPendingName: ctx.loginPendingName,
        handleSiblingCheck: ctx.handleSiblingCheck || (() => {}),
    }));

    // Only render if the flag is true and we have a name
    if (!showSiblingCheck || !loginPendingName) {
        return null;
    }
    
    const userName = loginPendingName || 'this user';
    const userNameDisplay = userName.toUpperCase();
    
    const handleYes = () => handleSiblingCheck(true);
    const handleNo = () => handleSiblingCheck(false);

    return (
        <div className="classroom-transition-page sibling-confirmation-page fixed inset-0 z-[100] animate-fade-in">
            <AdminBrand className="classroom-screen-brand" />
            <div className="sibling-confirmation-card animate-pop-in" role="dialog" aria-modal="true" aria-labelledby="sibling-confirmation-title">
                <span className="sibling-confirmation-icon" aria-hidden="true">
                    <FaRightFromBracket />
                </span>
                <h2 id="sibling-confirmation-title">
                    Are you <strong>{userNameDisplay}</strong> ?
                </h2>
                <div className="sibling-confirmation-actions">
                    <button type="button" className="sibling-confirmation-yes" onClick={handleYes}>
                        YES
                    </button>
                    <button type="button" className="sibling-confirmation-no" onClick={handleNo}>
                        NO
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SiblingCheckModal;
