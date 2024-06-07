import React, {useContext, useEffect, useState} from 'react';
import userManager from 'src/services/authService';
import BlankLayout from "../../@core/layouts/BlankLayout";
import {useAuth} from "src/hooks/useAuth";
import {useRouter} from "next/router";
import invitationService from "../../gendox-sdk/invitationService"; // Ensure you have the correct path to your OIDC UserManager setup

const AcceptInvitationPage = () => {
    const auth = useAuth();
    const router = useRouter();
    const [counter, setCounter] = useState(3);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        // Get email and token from URL params
        const { email, token } = router.query;
        if (!email || !token) {
            return ;
        }
        console.log('email and token', email, token);
        let interval;
        invitationService.acceptInvitation(email, token)
            .then(() => {
                console.log('User accepted invitation successfully! Waiting for user data to load...');
                setLoading(false);
                setError(false);
            })
            .catch(error => {
                console.error('Error handling OIDC redirect callback:', error);
                setLoading(false);
                setError(true);
            })
            .finally(() => {
                // Countdown timer for redirection
                interval = setInterval(() => {
                    setCounter(prevCounter => {
                        if (prevCounter <= 1) {
                            router.replace('/');
                            return 0;
                        }
                        return prevCounter - 1;
                    });
                }, 1000);
            });

        return () => clearInterval(interval);
    }, [router.query]);

    if (loading) {
        return <div>Loading...</div>; // Display a loading message while processing the callback
    }

    return (
        <div>
            {error ? (
                <div>
                    Something went wrong <br></br>
                    redirect to home in {counter} seconds, or{' '}
                    <a href="/" onClick={(e) => {
                        e.preventDefault();
                        router.replace('/');
                    }}>click here to go now</a>
                </div>
            ) : (
                <div>
                    Success!<br></br>
                    redirect to home in {counter} seconds, or{' '}
                    <a href="/" onClick={(e) => {
                        e.preventDefault();
                        router.replace('/');
                    }}>click here to go now</a>
                </div>
            )}
        </div>
    );
};

AcceptInvitationPage.getLayout = page => <BlankLayout>{page}</BlankLayout>
AcceptInvitationPage.authGuard = false
export default AcceptInvitationPage;
