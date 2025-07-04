import React from "react";
import "./About.css";

const AboutGoneGift = () => {
    return (
        <div className="aboutgonegift-container">
            <h1 className="aboutgonegift-title">About GoneGift</h1>

            <div className="aboutgonegift-content">
                <p>
                    I have always believed that the most precious things we leave behind are not material. They are our memories, our words, and the little moments that make up our story.
                    But too often, these memories fade or get lost, and the people we care about never hear the things we wished we’d said.
                </p>

                <p>
                    That is why I built GoneGift. It is a place where you can save everything that matters—letters, voice messages, photos—and make sure it reaches the people you love, even if you are not here to deliver it yourself.
                </p>

                <p>
                    When you sign up, you get a special encrypted credential that keeps all your content safe. It is like a private key that only you—and the people you trust—will ever hold. No one else can see what you share. Not even us.
                </p>

                <p>
                    GoneGift isn’t just about storing files. It is about connection. You can record a voice note to comfort someone on a hard day in the future, write a letter to be opened years from now, or create a collection of memories to pass down through your family.
                </p>

                <p>
                    For families who want to build something together, there is <strong>Shared Space</strong>. It is a shared vault where everyone can add their own memories, like creating a family book that never gets lost or forgotten.
                </p>

                <p>
                    I also wanted to make sure your content stays private and secure. That’s why GoneGift includes <strong>LifeBuddy</strong>, a quiet little helper that keeps an eye on your account. If you haven’t checked in for a while, it doesn’t act right away. First, it sends reminders and notifications, then follows up in phases over time. Only after all attempts have failed does it start releasing your memories to your beneficiaries. Everything is protected with <strong>End-to-End</strong> encryption, so your files stay locked and can only be opened with your special credentials.
                </p>


               

                <p>
                    More than anything, I wanted GoneGift to be a promise—a way to make sure your voice and your love will always find their way home.
                </p>

                <p className="aboutgonegift-signature">
                    — Vedant Kasar, Founder
                </p>
            </div>
        </div>
    );
};

export default AboutGoneGift;