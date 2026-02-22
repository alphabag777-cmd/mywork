export type Language = 'en' | 'zh' | 'ko' | 'ja';

export interface Translations {
  header: {
    connectWallet: string;
    connected: string;
  };
  staking: {
    investmentPlatform: string;
    title: string;
    titleHighlight: string;
    description: string;
    investmentStrategy: string;
    amountToInvest: string;
    max: string;
    invest: string;
    approving: string;
    confirming: string;
    investing: string;
    switchToBSC: string;
    tokenNotAvailable: string;
    insufficientBalance: string;
    enterValidAmount: string;
    pleaseConnectWallet: string;
    investmentFailed: string;
    successfullyInvested: string;
    binanceAlpha: string;
    insuranceHedge: string;
    chooseLikeCart: string;
    dailyProfit: string;
    recommended: string;
    details: string;
    goToWebsite: string;
    prepareParticipation: string;
    addToInvestmentList: string;
    referralCodeRequired: string;
    referralCodeRequiredDesc: string;
    registerReferralCode: string;
    projectAddedToList: string;
    projectAddedToListDesc: string;
  };
  userStakes: {
    yourInvestments: string;
    managePositions: string;
    totalInvested: string;
    totalRewards: string;
    activeInvestments: string;
    claimedInvestments: string;
    invested: string;
    activeStakes: string;
    claimedStakes: string;
    total: string;
    rewards: string;
    investmentNumber: string;
    investedAmount: string;
    pendingRewards: string;
    unlocksIn: string;
    unlocked: string;
    ready: string;
    days: string;
    unlockDate: string;
    claim: string;
    claiming: string;
    claimed: string;
    locked: string;
    noInvestments: string;
    noInvestmentsDesc: string;
    stakedAmount: string;
    rewardsClaimed: string;
    status: string;
  };
  referral: {
    yourReferralLink: string;
    shareDescription: string;
    yourReferralCode: string;
    joinAlphaBag: string;
    joinText: string;
    youWereReferred: string;
    registrationTitle: string;
    alphaBagTitle: string;
    registrationDescription: string;
    copySelected: string;
    saveAll: string;
    resetAll: string;
    saved: string;
    statusIdle: string;
    statusIdleDescription: string;
    projectMaxFi: string;
    projectLoomX: string;
    projectCodexField: string;
    maxFiUrl: string;
    loomXUrl: string;
    codexFieldUrl: string;
    enterReferralLink: string;
    linkSaved: string;
    linkCopied: string;
    linkDeleted: string;
    allLinksSaved: string;
    allLinksReset: string;
    selectProjects: string;
  };
  footer: {
    copyright: string;
  };
  common: {
    usdt: string;
  };
  projects: {
    viewDetails: string;
    goToDApp: string;
    minInvestment: string;
    bbagb: string;
    sbag: string;
    cbag: string;
    maxfi: string;
    numine: string;
    insurance: string;
    maxfiProject?: {
      focus: string;
      description: string;
      quickActionsDescription: string;
      tags: {
        binanceAlpha: string;
        nonCustodial: string;
        tradingBot: string;
      };
    };
    roomx?: {
      focus: string;
      description: string;
      quickActionsDescription: string;
      tags: {
        binanceAlpha: string;
        crossChain: string;
        tradingBot: string;
      };
    };
    codexfield?: {
      focus: string;
      description: string;
      quickActionsDescription: string;
      tags: {
        binanceAlpha: string;
        web3: string;
        aiAssets: string;
      };
    };
  };
  investment: {
    title: string;
    investmentStatus: string;
    successPopup: string;
    remaining40Manual: string;
    remaining40Description: string;
    projectDAppUrl: string;
    copy: string;
    openDApp: string;
    remaining40Funds: string;
    remaining40FundsDesc: string;
    disclaimer: string;
    testSuccessPopup: string;
    integrationStatus: string;
    currentStep: string;
    currentStepDesc: string;
    support: string;
    supportDesc: string;
    integratingWithBBAG: string;
    notYetConnected: string;
    urlCopied: string;
    copyFailed: string;
    invalidUrl: string;
    investmentSuccessful: string;
    investmentCompleted: string;
    gotIt: string;
    dappUrlPlaceholder: string;
  };
  projectDetails: {
    title: string;
    description: string;
    relatedMaterials: string;
    watchVideo: string;
    telegram: string;
    twitter: string;
    close: string;
    quickActions: string;
    resources: string;
    video: string;
    blog: string;
    keyMetrics?: string;
    detailInfo?: string;
    auditInfo?: string;
    youtubeVideo?: string;
    referenceMaterials?: string;
  };
  profile: {
    title: string;
    connectWallet: string;
    connectWalletDescription: string;
    myNodes: string;
    myNodesDescription: string;
    noNodesYet: string;
    myTotalInvestment: string;
    myTotalInvestmentDescription: string;
    totalInvestedAmount: string;
    separateInvestmentContract: string;
    separateInvestmentContractDescription: string;
    loadingInvestmentData: string;
    invested: string;
    investedInContract: string;
    investmentDetails: string;
    investmentId: string;
    amount: string;
    token: string;
    notInvestedInContract: string;
    walletBalance: string;
    walletBalanceDescription: string;
    availableForInvestment: string;
    price: string;
    nodeId: string;
    active: string;
    unknown: string;
    copiedToClipboard: string;
    failedToCopy: string;
    recommender: string;
    code: string;
    allocationBreakdown: string;
    sbagPositions: string;
    sbagPositionsDescription: string;
    noSBAGPositions: string;
    loadingSBAGPositions: string;
    backofficeEntered: string;
    investedUSDT: string;
    holdingNUMI: string;
    avgPriceUSDT: string;
    holdingUSDT: string;
    currentPriceUSDT: string;
    availableNUMI: string;
    unrealizedPL: string;
    sellDelegation: string;
    pendingSells: string;
    sellAmount: string;
    holdingAmount: string;
    estimatedPL: string;
    slippageWarning: string;
    slippageWarningText: string;
    confirmSellDelegation: string;
    positionNotConfirmed: string;
    noNUMIAvailable: string;
    sellDelegationSubmitted: string;
    priceUpdated: string;
    failedToFetchPrice: string;
    failedToRefreshPrice: string;
    alphaBag: string;
    projectAllocation: string;
    sbagAllocation: string;
    insuranceAllocation: string;
    totalAllocation: string;
    copy: string;
  };
  community: {
    title: string;
    overallTeamPerformance: string;
    marketLevel: string;
    teamNode: string;
    personalPerformance: string;
    regionalPerformance: string;
    communityPerformance: string;
    thirtySky: string;
    totalTeamPerformance: string;
    totalTeamMembers: string;
    myShare: string;
    numberOfDirectPush: string;
    totalNumberOfTeamMembers: string;
    noDirectReferrals: string;
  };
  notFound: {
    title: string;
    description: string;
    returnToHome: string;
  };
  agreement: {
    title: string;
    subtitle: string;
    agreeLabel: string;
    agreeButton: string;
    section1Title: string;
    section1Content: string;
    section2Title: string;
    section2Content: string;
    section3Title: string;
    section3Intro: string;
    section3Point1: string;
    section3Point2: string;
    section3Point3: string;
    section4Title: string;
    section4Intro: string;
    section4Point1: string;
    section4Point2: string;
    section4Point3: string;
    section5Title: string;
    section5Intro: string;
    section5Content: string;
    section6Title: string;
    section6Intro: string;
    section6Point1: string;
    section6Point2: string;
    section6Point3: string;
    section7Title: string;
    section7Intro: string;
    section7Content: string;
    section8Title: string;
    section8Intro: string;
    section8Point1: string;
    section8Point2: string;
    section8Point3: string;
  };
  introduction: {
    hero: {
      title: string;
      p1: string;
      p2: string;
    };
    why: {
      h: string;
      p1: string;
      c1h: string;
      c1p: string;
      c2h: string;
      c2p: string;
      c3h: string;
      c3p: string;
      p2: string;
      p3: string;
    };
    life: {
      c1h: string;
      c1p: string;
      c2h: string;
      c2p: string;
      c3h: string;
      c3p: string;
    };
    core: {
      h: string;
      p1: string;
      li1: string;
      li2: string;
      li3: string;
      li4: string;
      li5: string;
    };
    com: {
      h: string;
      p1: string;
      li1: string;
      li2: string;
      li3: string;
      p2: string;
      li4: string;
      li5: string;
      li6: string;
      p3: string;
    };
    pos: {
      h: string;
      p1: string;
      c1h: string;
      c1p: string;
      c2h: string;
      c2p: string;
      c3h: string;
      c3p: string;
      p2: string;
      p3: string;
      p4: string;
      mapH: string;
      mapP: string;
      mapPre: string;
    };
    g: {
      h: string;
      p1: string;
      li1: string;
      li2: string;
      li3: string;
      p2: string;
      li4: string;
      li5: string;
      li6: string;
      p3: string;
      p4: string;
    };
    bag: {
      h: string;
      p1: string;
      abag: string;
      bbag: string;
      cbag: string;
      sbag: string;
      p2: string;
    };
    lead: {
      h: string;
      p1: string;
      p2: string;
      c1h: string;
      c1p: string;
      c2h: string;
      c2p: string;
      c3h: string;
      c3p: string;
      p3: string;
      p4: string;
      p5: string;
    };
    inv: {
      h: string;
      p1: string;
      p2: string;
      p3: string;
      p4: string;
      p5: string;
      p6: string;
    };
    fin: {
      h: string;
      p1: string;
      p2: string;
      p3: string;
    };
    foot: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    header: {
      connectWallet: 'Connect Wallet',
      connected: 'Connected',
    },
    staking: {
      investmentPlatform: 'Investment Platform',
      title: 'Decentralized ',
      titleHighlight: 'On-Chain',
      description: 'A decentralized on-chain treasury management protocol is a blockchain-based system that enables DAOs, Web3 projects, and communities to securely manage, allocate, and execute financial resources transparently and autonomously on-chain.',
      investmentStrategy: 'The projects invested in AlphaBag aim to safely increase profits through diversified investment. Standard plans recommend diversified investment with BBAG, SBAG (Binance Alpha), and CBAG. Self-Collection plans send 100% to a single wallet of your choice.',
      amountToInvest: 'Amount to Invest',
      max: 'Max',
      invest: 'Invest',
      approving: 'Approving...',
      confirming: 'Confirming...',
      investing: 'Investing...',
      switchToBSC: 'Switch to BSC Mainnet',
      tokenNotAvailable: 'Token Not Available',
      insufficientBalance: 'Insufficient balance',
      enterValidAmount: 'Please enter a valid amount',
      pleaseConnectWallet: 'Please connect your wallet',
      investmentFailed: 'Investment failed',
      successfullyInvested: 'Successfully invested',
      binanceAlpha: 'BINANCE Alpha +',
      insuranceHedge: 'Insurance(Hedge)',
      chooseLikeCart: 'Choose like a cart',
      dailyProfit: 'DAILY PROFIT',
      recommended: 'Recommended:',
      details: 'Details',
      goToWebsite: 'Go to Website',
      prepareParticipation: 'PREPARE PARTICIPATION',
      addToInvestmentList: 'Add to Investment List',
      referralCodeRequired: 'Referral Code Required',
      referralCodeRequiredDesc: 'A popup message will appear asking you to enter a referral code before proceeding with the investment. If a referral code is already registered, the process will continue. If no referral code is registered, you will be prompted to register one before investing.',
      registerReferralCode: 'Register Referral Code',
      projectAddedToList: 'Project Added to Investment List',
      projectAddedToListDesc: 'The project has been added to your investment list. You can proceed with the investment process.',
    },
    userStakes: {
      yourInvestments: 'Your Investments',
      managePositions: 'Manage your investment positions',
      totalInvested: 'Total Invested',
      totalRewards: 'Total Rewards',
      activeInvestments: 'Active Investments',
      claimedInvestments: 'Claimed Investments',
      invested: 'invested',
      activeStakes: 'Active Investments',
      claimedStakes: 'Claimed Investments',
      total: 'Total',
      rewards: 'rewards',
      investmentNumber: 'Investment #',
      investedAmount: 'Invested Amount',
      pendingRewards: 'Pending Rewards',
      unlocksIn: 'Unlocks In',
      unlocked: 'Unlocked',
      ready: 'Ready',
      days: 'days',
      unlockDate: 'Unlock Date',
      claim: 'Claim',
      claiming: 'Claiming...',
      claimed: 'Claimed',
      locked: 'Locked',
      noInvestments: 'No Investments',
      noInvestmentsDesc: "You don't have any investments yet. Start investing to earn rewards!",
      stakedAmount: 'Staked Amount',
      rewardsClaimed: 'Rewards Claimed',
      status: 'Status',
    },
    referral: {
      yourReferralLink: 'Your Referral Link',
      shareDescription: 'Share your referral link and earn rewards when others join using your code',
      yourReferralCode: 'Your Referral Code',
      joinAlphaBag: 'Join AlphaBag Investment',
      joinText: 'Join me on AlphaBag Investment and start earning rewards!',
      youWereReferred: 'You were referred by code',
      registrationTitle: 'Referral Code Registration',
      alphaBagTitle: 'Alpha BAG',
      registrationDescription: 'Paste, edit, and save referral links per project. Copy saved referral links to share with your referrers.',
      copySelected: 'Copy Selected',
      saveAll: 'Save All',
      resetAll: 'Reset All',
      saved: 'Saved',
      statusIdle: 'Status: Idle',
      statusIdleDescription: 'Enter and save referral links for each project.',
      projectMaxFi: 'MaxFi',
      projectLoomX: 'LoomX (LoomX)',
      projectCodexField: 'CodexField',
      maxFiUrl: 'https://www.maxfi.io/?ref=...',
      loomXUrl: 'https://app.loom-x.com/?ref=...',
      codexFieldUrl: 'https://app.codexfield.co/?ref=...',
      enterReferralLink: 'Enter referral link',
      linkSaved: 'Link saved successfully',
      linkCopied: 'Link copied to clipboard',
      linkDeleted: 'Link deleted',
      allLinksSaved: 'All links saved successfully',
      allLinksReset: 'All links reset',
      selectProjects: 'Select projects to copy',
    },
    footer: {
      copyright: '© 2025 AlphaBag Investment. All rights reserved.',
    },
    common: {
      usdt: 'USDT',
    },
    investment: {
      title: 'Investment',
      investmentStatus: 'Investment Status',
      successPopup: 'Show a success popup after investment is completed and provide instructions for the remaining 40% manual investment.',
      remaining40Manual: 'Remaining 40% Manual Investment',
      remaining40Description: 'We are currently integrating with the BBAG project. Until the integration is completed, please use the link below to enter the project DApp and manually complete the investment with the remaining 40% funds in your wallet.',
      projectDAppUrl: 'Project DApp URL',
      copy: 'Copy',
      openDApp: 'Open DApp',
      remaining40Funds: 'Remaining 40% Funds (Reference)',
      remaining40FundsDesc: 'Check your wallet balance and complete the manual investment in the DApp',
      disclaimer: '* This guidance may change to automatic investment once the integration is completed.',
      testSuccessPopup: 'Test Success Popup',
      integrationStatus: 'Integration Status',
      currentStep: 'Current Step',
      currentStepDesc: '40% manual investment required',
      support: 'Support',
      supportDesc: 'Contact the operations team if you encounter issues',
      integratingWithBBAG: 'Integrating with BBAG',
      notYetConnected: 'Not yet connected',
      urlCopied: 'DApp URL copied to clipboard!',
      copyFailed: 'Failed to copy URL',
      invalidUrl: 'Please enter a valid DApp URL',
      investmentSuccessful: 'Investment Successful!',
      investmentCompleted: 'Your investment has been completed successfully.',
      gotIt: 'Got it',
      dappUrlPlaceholder: 'https://YOUR-DAPP-LINK-HERE',
    },
    projectDetails: {
      title: 'Project Details',
      description: 'Project Description',
      relatedMaterials: 'Related Materials',
      watchVideo: 'Watch Video',
      telegram: 'Telegram',
      twitter: 'Twitter',
      close: 'Close',
      quickActions: 'Quick Actions',
      resources: 'Resources',
      video: 'Video',
      blog: 'Blog',
      keyMetrics: 'Key Metrics',
      detailInfo: 'Detail Information',
      auditInfo: 'Audit Information',
      youtubeVideo: 'YouTube Video',
      referenceMaterials: 'Reference Materials',
      goToDApp: 'Go directly to this project\'s DApp',
      minInvestment: 'Minimum investment: $250',
      bbagb: 'B-BAGB',
      sbag: 'S-SBAG BAG',
      cbag: 'C-BAG',
      maxfi: 'MaxFi',
      numine: 'Numine',
      insurance: 'Insurance',
      maxfiProject: {
        focus: 'Stable / Treasury-focused',
        description: 'A non-custodial trading bot that starts in Telegram and completes on-chain. Daily profit 0.6%-2%. Principal withdraw anytime.',
        quickActionsDescription: 'Non-custodial + on-chain settlement with flexible principal withdrawal.',
        tags: {
          binanceAlpha: 'Binance Alpha',
          nonCustodial: 'Non-custodial',
          tradingBot: 'Trading Bot',
        },
      },
      roomx: {
        focus: 'Growth / Balanced',
        description: 'Cross-chain + non-custodial trading bot. Daily 1.8%. Principal returned after profit realization. Auto payout to wallet when profit reaches 5 USDT.',
        quickActionsDescription: 'Cross-chain execution with auto payout mechanism (5 USDT threshold).',
        tags: {
          binanceAlpha: 'Binance Alpha',
          crossChain: 'Cross-chain',
          tradingBot: 'Trading Bot',
        },
      },
      codexfield: {
        focus: 'Strategy / Structured',
        description: 'CodexField is a core token for a Web3 content & AI asset trading platform. Backed by Binance Labs. Daily yield 1%.',
        quickActionsDescription: 'Highlight the content/AI asset narrative + Binance Labs backing.',
        tags: {
          binanceAlpha: 'Binance Alpha',
          web3: 'Web3',
          aiAssets: 'AI Assets',
        },
      },
    },
    profile: {
      title: 'Profile',
      connectWallet: 'Connect Your Wallet',
      connectWalletDescription: 'Please connect your wallet to view your profile',
      myNodes: 'My Nodes',
      myNodesDescription: 'View all nodes you have purchased',
      noNodesYet: 'You haven\'t purchased any nodes yet',
      myTotalInvestment: 'My Total Investment',
      myTotalInvestmentDescription: 'Your total investment in the platform',
      totalInvestedAmount: 'Total invested amount',
      separateInvestmentContract: 'MAXFI Investment',
      separateInvestmentContractDescription: 'Your investments in the MAXFI investment contract',
      loadingInvestmentData: 'Loading investment data...',
      invested: 'Invested',
      investedInContract: 'You have invested in this contract',
      investmentDetails: 'Investment Details',
      investmentId: 'Investment ID:',
      amount: 'Amount:',
      token: 'Token:',
      notInvestedInContract: 'You haven\'t invested in this contract yet',
      walletBalance: 'Wallet Balance',
      walletBalanceDescription: 'Your current USDT balance',
      availableForInvestment: 'Available for investment',
      price: 'Price:',
      nodeId: 'Node ID:',
      active: 'Active',
      unknown: 'Unknown',
      copiedToClipboard: 'Copied to clipboard!',
      failedToCopy: 'Failed to copy',
      recommender: 'Recommender:',
      code: 'Code:',
      allocationBreakdown: 'Allocation Breakdown',
      sbagPositions: 'SBAG Positions (NUMI)',
      sbagPositionsDescription: 'Your SBAG positions with real-time NUMI price tracking',
      noSBAGPositions: 'No SBAG positions found',
      loadingSBAGPositions: 'Loading SBAG positions...',
      backofficeEntered: 'Backoffice entered',
      investedUSDT: 'Invested USDT',
      holdingNUMI: 'Holding NUMI',
      avgPriceUSDT: 'Avg Price (USDT)',
      holdingUSDT: 'Holding USDT',
      currentPriceUSDT: 'Current Price (USDT)',
      availableNUMI: 'Available NUMI',
      unrealizedPL: 'Unrealized P/L',
      sellDelegation: 'Sell Delegation',
      pendingSells: 'Pending Sells',
      sellAmount: 'Sell Amount (NUMI)',
      holdingAmount: 'Holding Amount',
      estimatedPL: 'Estimated P/L',
      slippageWarning: 'Slippage Warning',
      slippageWarningText: 'A sell slippage of 5% to 10% may occur depending on market liquidity. Press Confirm to proceed with sell delegation.',
      confirmSellDelegation: 'Confirm Sell Delegation',
      positionNotConfirmed: 'Position not yet confirmed by back-office',
      noNUMIAvailable: 'No NUMI available to sell',
      sellDelegationSubmitted: 'Sell delegation submitted successfully',
      priceUpdated: 'Price updated successfully',
      failedToFetchPrice: 'Failed to fetch price',
      failedToRefreshPrice: 'Failed to refresh price',
      alphaBag: 'Alpha BAG',
      projectAllocation: 'Project allocation',
      sbagAllocation: 'SBAG allocation',
      insuranceAllocation: 'Insurance allocation',
      totalAllocation: 'Total allocation',
      copy: 'Copy',
    },
    community: {
      title: 'Community',
      overallTeamPerformance: 'Overall Team Performance',
      marketLevel: 'Market level',
      teamNode: 'Team node',
      personalPerformance: 'Personal performance',
      regionalPerformance: 'Regional performance',
      communityPerformance: 'Community performance',
      thirtySky: '30sky',
      totalTeamPerformance: 'Total team performance',
      totalTeamMembers: 'Total number of team members',
      myShare: 'my share',
      numberOfDirectPush: 'Number of direct push',
      totalNumberOfTeamMembers: 'Total number of team members',
      noDirectReferrals: 'No direct referrals yet',
    },
    notFound: {
      title: 'Oops! Page not found',
      description: '404',
      returnToHome: 'Return to Home',
    },
    agreement: {
      title: 'Platform Participation & Risk Acknowledgment Agreement',
      subtitle: 'Please read and accept the terms before continuing',
      agreeLabel: 'I agree to the Terms & Conditions',
      agreeButton: 'Agree',
      section1Title: '1. Platform Purpose',
      section1Content: 'This platform is a community-based platform designed to support project incubation and market development. Its primary purpose is to assist projects in improving market visibility and sustainability, while reducing potential losses through diversified investment strategies, except in cases of projects intentionally created as scams.',
      section2Title: '2. Nature of the Platform',
      section2Content: 'The platform operates solely as a community-driven project support and collaboration platform. It does not constitute an investment advisory service, financial institution, asset manager, or guarantee mechanisms of any kind.',
      section3Title: '3. Investment Structure and Risk',
      section3Intro: 'Participants acknowledge and agree that:',
      section3Point1: 'The platform encourages diversified investment as a method to pursue relatively stable asset growth.',
      section3Point2: 'Investment participation does not guarantee the preservation or return of capital.',
      section3Point3: 'All investments involve inherent risks, including but not limited to market volatility, project failure, liquidity risk, regulatory risk, and technological risk.',
      section4Title: '4. No Guarantees or Capital Protection',
      section4Intro: 'Participants understand and agree that:',
      section4Point1: 'The platform does not provide any guarantees or capital protection.',
      section4Point2: 'There is no obligation, mandate, or mandatory participation in any project introduced through the platform.',
      section4Point3: 'The platform does not provide insurance, cooperatives, or any form of financial protection for investment outcomes.',
      section5Title: '5. Community Collaboration',
      section5Intro: 'Participants understand and agree that:',
      section5Content: 'The platform functions as a collaborative community, where members collectively seek methods to reduce risks and improve sustainability. All discussions, messages, and shared information are provided for reference purposes only and should not be considered financial or legal advice.',
      section6Title: '6. Participant Responsibilities',
      section6Intro: 'Each participant agrees that:',
      section6Point1: 'All participation and investment decisions are made at their own discretion and responsibility.',
      section6Point2: 'They have conducted or will conduct independent due diligence before engaging in any project.',
      section6Point3: 'The platform, its operators, contributors, and affiliated parties shall not be held liable for any direct or indirect losses.',
      section7Title: '7. Disclaimer of Liability',
      section7Intro: 'To the maximum extent permitted by applicable law:',
      section7Content: 'The platform and its associated parties shall not be responsible for any loss, damage, or claim arising from participation, investment decisions, or project outcomes. This includes, but is not limited to, financial loss, reputational damage, or other damages.',
      section8Title: '8. Acknowledgment and Consent',
      section8Intro: 'By participating in the platform, the participant confirms that:',
      section8Point1: 'They have read, understood, and agreed to all of the terms stated above.',
      section8Point2: 'They acknowledge that investment decisions and participation is based on self-responsibility and risk awareness.',
      section8Point3: 'They release the platform providers from all claims and investment guarantees.',
    },
    introduction: {
      hero: {
        title: 'The Center of the Crypto Ecosystem<br/><span>AlphaBag Community Platform</span>',
        p1: 'AlphaBag is not a single protocol or project. It is a community-driven market activation platform connecting exchanges, media, projects, investors, and VCs.',
        p2: 'Every market has Tier-1 and Tier-2 players. AlphaBag stands as a neutral yet powerful hub that can connect all layers.',
      },
      why: {
        h: 'Why AlphaBag Was Created',
        p1: 'In Web3, projects collapse for many reasons. Regardless of vision or technology, external and internal factors can break a project at any time.',
        c1h: 'Security & Technical Risk',
        c1p: 'Hacks, contract vulnerabilities, and intentional laundering can destroy a project in a single incident.',
        c2h: 'Capital Flow Problems',
        c2p: 'Too little inflow—or sudden massive inflow—can destabilize structures and trigger collapse.',
        c3h: 'Malicious Profit-Taking',
        c3p: 'Fast profit-taking, insider dumping, and short-term designs rapidly destroy trust.',
        p2: 'Leaders may work hard without seeing the real problem—until the project collapses. Then they face <b>lost trust</b> and potentially <b>legal risk</b>.',
        p3: 'AlphaBag was built to avoid repeating these failures: reduce single-project dependence, and operate funds more safely through <b>diversification and protection (insurance-like) structures</b> to minimize <b>principal loss</b>.',
      },
      life: {
        c1h: 'Projects Have Life Cycles',
        c1p: 'No project lasts forever; growth and decline are natural phases.',
        c2h: 'Leaders Are Already Investing',
        c2p: 'Even without a platform, leaders select and run multiple projects.',
        c3h: 'Loss Is Often Unmanaged',
        c3p: 'Many models focus on upside while leaving downside risk to individuals.',
      },
      core: {
        h: 'Core Direction of AlphaBag',
        p1: 'AlphaBag prioritizes survival before profit—managing risk through diversification and protection structures.',
        li1: 'All investments assume risk',
        li2: 'No single-project dependency',
        li3: 'Profit + protection in parallel',
        li4: 'On-chain transparency',
        li5: 'DAO & community-driven governance',
      },
      com: {
        h: 'Community Principles & Growth Strategy',
        p1: 'AlphaBag is built on portfolio rotation and extreme diversification—tracking and participating across 100+ projects while keeping the organization intact long-term.',
        li1: '<b>100+ projects</b>: avoid reliance on one project; track and participate broadly.',
        li2: '<b>Rotation</b>: rebalance to reduce risk and expand opportunity as conditions change.',
        li3: '<b>Long-term organization</b>: keep operations stable even when projects change.',
        p2: 'As the community grows, collective execution enables multiple revenue and hedging approaches.',
        li4: '<b>Co-mint / co-execute</b>: pursue undervalued opportunities, including memecoin segments.',
        li5: '<b>Hedging</b>: use shared profits to reduce volatility risk.',
        li6: '<b>Airdrop accumulation</b>: expand token holdings through sustained participation.',
        p3: 'With scale, AlphaBag plans ecosystem tokenization to share growth with all participants. Before token issuance, a <b>points system</b> rewards contribution and activity.',
      },
      pos: {
        h: 'Position & Role of AlphaBag',
        p1: 'Crypto is a complex ecosystem where <b>exchanges, media, projects, communities, and VCs</b> move with different incentives. AlphaBag aims to be the <b>central hub</b> connecting them.',
        c1h: 'Exchanges',
        c1p: 'Tier-1 exchanges often avoid surface-level partnerships with network orgs or smaller exchanges due to competition and scale differences.',
        c2h: 'Media & VC',
        c2p: 'Top media and VCs need trustworthy intermediaries; they rarely work with unverified communities directly.',
        c3h: 'Community & Projects',
        c3p: 'Projects need liquidity, volume, and participants—yet often lack durable activation structures.',
        p2: 'AlphaBag can work with top exchanges, top media, and top investors because it also holds what moves markets: <b>leaders, organization, and community</b>.',
        p3: 'AlphaBag aims to reactivate markets when liquidity drains, accelerate early-stage traction, and revive projects that are fading—because organization and leaders matter most.',
        p4: 'From Tier-1 to incubating projects, AlphaBag targets the best cross-point where broad cooperation becomes possible.',
        mapH: 'AlphaBag Ecosystem Map',
        mapP: '(Text-based hub layout)',
        mapPre: '        [ Top Exchanges ]\n  Binance / Coinbase / Upbit\n              │\n[ Top Media & VC ] ── AlphaBag ── [ Community & Leaders ]\n              │\n     [ Projects & Incubation ]',
      },
      g: {
        h: 'Global Expansion & Mid-to-Long-Term Vision',
        p1: 'AlphaBag is building country-level decentralized communities with leaders across <b>20+ countries</b>, forming an ecosystem of <b>co-builders</b>.',
        li1: '<b>2026 goal</b>: 1,000+ core leaders per country',
        li2: '<b>Active users</b>: expand with 100,000+ active users as a base',
        li3: '<b>Mid-term scale</b>: 2,000,000+ global participants',
        p2: 'In partnership with foundations and partners, AlphaBag is screening pipeline projects including Binance Alpha candidates and long-term high-quality assets.',
        li4: 'Long-term assets: <b>ETH, BNB, OKB, SOL</b>',
        li5: 'Long-duration DeFi: structures designed to last (e.g., Origin-style longevity)',
        li6: 'New Alpha: early-stage but structurally strong projects',
        p3: 'Most investments won\'t become huge winners—but if one or two (or more) succeed, the portfolio can grow exponentially.',
        p4: 'AlphaBag focuses on improving the odds through longevity, protection, and diversification.',
      },
      bag: {
        h: 'AlphaBag BAG System',
        p1: 'AlphaBag is designed as a multi-layer asset operation framework that adapts to risk preferences and market conditions.',
        abag: 'ABAG is the core safety layer—built on the most sustainable long-term DeFi design (model updates in progress; launching soon).',
        bbag: 'BBAG is the main zone focused on <b>fixed staking</b> plus <b>team/network revenue</b>, producing <b>daily and monthly</b> income models.',
        cbag: 'CBAG allocates about <b>20%</b> to protective reserves/liquidity assets to reduce downside and support an insurance-like compensation concept.',
        sbag: 'SBAG is a special-project zone that supports <b>real-time withdrawal of principal and profits</b>.',
        p2: 'BAG prioritizes risk management, durability, and capital protection over short-term hype.',
      },
      lead: {
        h: 'Leader-Centric Structure',
        p1: 'Leaders want to stay leaders; investors want to keep trusting the leader\'s selections and remain together long-term.',
        p2: 'In reality, projects fail or better opportunities emerge—so broad diversification is the practical choice. Many mid-tier leaders already participate across multiple projects.',
        c1h: 'Risk of Single-Project Focus',
        c1p: 'Concentration can create big upside—but also big downside when a project collapses.',
        c2h: 'Different Investor Tastes',
        c2p: 'Investors vary: conservative, aggressive, and everything in between—one project can\'t satisfy all.',
        c3h: 'Need for a Trusted Intermediary',
        c3p: 'Investors need fast information, diversification options, and verified founders/tech—through a credible platform.',
        p3: 'AlphaBag aims to build a professional validation layer with expert nodes across media, VC, exchanges, influencers, legal, and finance to filter malicious or poorly designed projects.',
        p4: 'For leaders, AlphaBag also aims to preserve organizational legs so projects can shift horizontally without rebuilding teams—supporting automatic monetization across cycles.',
        p5: 'At the core: organizational continuity and trust-based long-term operation.',
      },
      inv: {
        h: 'Investment Reality & AlphaBag Philosophy',
        p1: 'No investment can guarantee 100% profit. Many Web3 models capture value from investors rather than returning value to them.',
        p2: 'Markets are free-trade environments; entering at tops and getting stuck is common.',
        p3: 'Returns often come from buying lows, taking profits into highs, and using diverse options.',
        p4: 'AlphaBag targets stable compounding: enter lows fast, grow, and re-enter new low zones to continue compounding.',
        p5: 'At the same time, a small portion can be allocated to high-risk/high-reward areas (e.g., memecoins) to capture occasional outsized wins.',
        p6: 'AlphaBag\'s purpose is to turn hard-earned leader–investor trust into a platform-based, durable, decentralized community that can last across generations—where users grow assets together, not get exploited.',
      },
      fin: {
        h: 'Final Message',
        p1: 'If you\'re hesitating—leaders and members alike—markets will ultimately move toward community investment platforms like AlphaBag.',
        p2: 'What matters is not whether you join, but <b>how early</b>. Earlier participants can build stronger networks and join the compounding growth wave sooner.',
        p3: 'AlphaBag is not a short-term trend. It aims to be a long-term structure where leaders and community grow together.',
      },
      foot: '© AlphaBag Community Platform. All rights reserved.',
    },
  },
  zh: {
    header: {
      connectWallet: '连接钱包',
      connected: '已连接',
    },
    staking: {
      investmentPlatform: '投资平台',
      title: '去中心化 ',
      titleHighlight: '链上',
      description: '去中心化链上资金管理协议是一个基于区块链的系统，使DAO、Web3项目和社区能够透明、自主地在链上安全地管理、分配和执行财务资源。',
      investmentStrategy: 'AlphaBag 的投资项目旨在通过分散投资安全地增加利润。标准计划建议在 BBAG、币安 Alpha 项目 SBAG 以及更安全的 CBAG 之间进行分散投资。自选收藏计划将 100% 发送到您选择的单个钱包。',
      amountToInvest: '投资金额',
      max: '最大',
      invest: '投资',
      approving: '批准中...',
      confirming: '确认中...',
      investing: '投资中...',
      switchToBSC: '切换到BSC主网',
      tokenNotAvailable: '代币不可用',
      insufficientBalance: '余额不足',
      enterValidAmount: '请输入有效金额',
      pleaseConnectWallet: '请连接您的钱包',
      investmentFailed: '投资失败',
      successfullyInvested: '投资成功',
      binanceAlpha: 'BINANCE Alpha +',
      insuranceHedge: '保险(对冲)',
      chooseLikeCart: '像购物车一样选择',
      dailyProfit: '每日收益',
      recommended: '推荐:',
      details: '详情',
      goToWebsite: '前往网站',
      prepareParticipation: '准备参与',
      addToInvestmentList: '添加到投资列表',
      referralCodeRequired: '需要推荐码',
      referralCodeRequiredDesc: '将出现一个弹出消息，要求您在继续投资之前输入推荐码。如果已注册推荐码，流程将继续。如果未注册推荐码，系统将提示您在投资前注册一个。',
      registerReferralCode: '注册推荐码',
      projectAddedToList: '项目已添加到投资列表',
      projectAddedToListDesc: '该项目已添加到您的投资列表。您可以继续投资流程。',
    },
    userStakes: {
      yourInvestments: '您的投资',
      managePositions: '管理您的投资头寸',
      totalInvested: '总投资额',
      totalRewards: '总奖励',
      activeInvestments: '活跃投资',
      claimedInvestments: '已领取投资',
      invested: '已投资',
      activeStakes: '活跃投资',
      claimedStakes: '已领取投资',
      total: '总计',
      rewards: '奖励',
      investmentNumber: '投资 #',
      investedAmount: '投资金额',
      pendingRewards: '待领取奖励',
      unlocksIn: '解锁时间',
      unlocked: '已解锁',
      ready: '就绪',
      days: '天',
      unlockDate: '解锁日期',
      claim: '领取',
      claiming: '领取中...',
      claimed: '已领取',
      locked: '已锁定',
      noInvestments: '暂无投资',
      noInvestmentsDesc: '您还没有任何投资。开始投资以赚取奖励！',
      stakedAmount: '投资金额',
      rewardsClaimed: '已领取奖励',
      status: '状态',
    },
    referral: {
      yourReferralLink: '您的推荐链接',
      shareDescription: '分享您的推荐链接，当其他人使用您的代码加入时赚取奖励',
      yourReferralCode: '您的推荐代码',
      joinAlphaBag: '加入AlphaBag投资',
      joinText: '加入我使用AlphaBag投资，开始赚取奖励！',
      youWereReferred: '您被代码推荐',
      registrationTitle: '推荐码注册',
      alphaBagTitle: 'Alpha BAG',
      registrationDescription: '粘贴、编辑并按项目保存推荐链接。复制保存的推荐链接与您的推荐人分享。',
      copySelected: '复制选中的',
      saveAll: '保存全部',
      resetAll: '重置全部',
      saved: '已保存',
      statusIdle: '状态：空闲',
      statusIdleDescription: '为每个项目输入并保存推荐链接。',
      projectMaxFi: 'MaxFi',
      projectLoomX: 'LoomX (LoomX)',
      projectCodexField: 'CodexField',
      maxFiUrl: 'https://www.maxfi.io/?ref=...',
      loomXUrl: 'https://app.loom-x.com/?ref=...',
      codexFieldUrl: 'https://app.codexfield.co/?ref=...',
      enterReferralLink: '输入推荐链接',
      linkSaved: '链接保存成功',
      linkCopied: '链接已复制到剪贴板',
      linkDeleted: '链接已删除',
      allLinksSaved: '所有链接保存成功',
      allLinksReset: '所有链接已重置',
      selectProjects: '选择要复制的项目',
    },
    footer: {
      copyright: '© 2025 AlphaBag投资。保留所有权利。',
    },
    common: {
      usdt: 'USDT',
    },
    investment: {
      title: '投资',
      investmentStatus: '投资状态',
      successPopup: '投资完成后显示成功弹窗，并提供剩余40%手动投资的说明。',
      remaining40Manual: '剩余40%手动投资',
      remaining40Description: '我们目前正在与BBAG项目集成。在集成完成之前，请使用下面的链接进入项目DApp，并使用钱包中剩余40%的资金手动完成投资。',
      projectDAppUrl: '项目DApp URL',
      copy: '复制',
      openDApp: '打开DApp',
      remaining40Funds: '剩余40%资金（参考）',
      remaining40FundsDesc: '检查您的钱包余额并在DApp中完成手动投资',
      disclaimer: '* 集成完成后，此指导可能会更改为自动投资。',
      testSuccessPopup: '测试成功弹窗',
      integrationStatus: '集成状态',
      currentStep: '当前步骤',
      currentStepDesc: '需要40%手动投资',
      support: '支持',
      supportDesc: '如遇问题，请联系运营团队',
      integratingWithBBAG: '正在与BBAG集成',
      notYetConnected: '尚未连接',
      urlCopied: 'DApp URL已复制到剪贴板！',
      copyFailed: '复制URL失败',
      invalidUrl: '请输入有效的DApp URL',
      investmentSuccessful: '投资成功！',
      investmentCompleted: '您的投资已成功完成。',
      gotIt: '知道了',
      dappUrlPlaceholder: 'https://YOUR-DAPP-LINK-HERE',
    },
    projectDetails: {
      title: '项目详情',
      description: '项目描述',
      relatedMaterials: '相关材料',
      watchVideo: '观看视频',
      telegram: 'Telegram',
      twitter: 'Twitter',
      close: '关闭',
      quickActions: '快速操作',
      resources: '资源',
      video: '视频',
      blog: '博客',
      keyMetrics: '核心指标',
      detailInfo: '详细信息',
      auditInfo: '审计信息',
      youtubeVideo: 'YouTube 视频',
      referenceMaterials: '参考资料',
    },
    projects: {
      viewDetails: '查看详情',
      goToDApp: '直接前往此项目的DApp',
      minInvestment: '最低投资额：$250',
      bbagb: 'B-BAGB',
      sbag: 'S-SBAG BAG',
      cbag: 'C-BAG',
      maxfi: 'MaxFi',
      numine: 'Numine',
      insurance: '保险',
      maxfiProject: {
        focus: '稳定 / 资金库导向',
        description: '一个非托管交易机器人，从Telegram开始并在链上完成。每日利润0.6%-2%。本金可随时提取。',
        quickActionsDescription: '非托管 + 链上结算，灵活提取本金。',
        tags: {
          binanceAlpha: '币安Alpha',
          nonCustodial: '非托管',
          tradingBot: '交易机器人',
        },
      },
      roomx: {
        focus: '增长 / 平衡',
        description: '跨链 + 非托管交易机器人。每日1.8%。利润实现后返还本金。当利润达到5 USDT时自动支付到钱包。',
        quickActionsDescription: '跨链执行，自动支付机制（5 USDT阈值）。',
        tags: {
          binanceAlpha: '币安Alpha',
          crossChain: '跨链',
          tradingBot: '交易机器人',
        },
      },
      codexfield: {
        focus: '策略 / 结构化',
        description: 'CodexField是Web3内容和AI资产交易平台的核心代币。由币安实验室支持。每日收益1%。',
        quickActionsDescription: '突出内容/AI资产叙事 + 币安实验室支持。',
        tags: {
          binanceAlpha: '币安Alpha',
          web3: 'Web3',
          aiAssets: 'AI资产',
        },
      },
    },
    profile: {
      title: '个人资料',
      connectWallet: '连接钱包',
      connectWalletDescription: '请连接您的钱包以查看个人资料',
      myNodes: '我的节点',
      myNodesDescription: '查看您购买的所有节点',
      noNodesYet: '您尚未购买任何节点',
      myTotalInvestment: '我的总投资',
      myTotalInvestmentDescription: '您在平台上的总投资',
      totalInvestedAmount: '总投资金额',
      separateInvestmentContract: '单独投资合约',
      separateInvestmentContractDescription: '您在单独投资合约中的投资',
      loadingInvestmentData: '加载投资数据...',
      invested: '已投资',
      investedInContract: '您已在此合约中投资',
      investmentDetails: '投资详情',
      investmentId: '投资ID:',
      amount: '金额:',
      token: '代币:',
      notInvestedInContract: '您尚未在此合约中投资',
      walletBalance: '钱包余额',
      walletBalanceDescription: '您当前的USDT余额',
      availableForInvestment: '可用于投资',
      price: '价格:',
      nodeId: '节点ID:',
      active: '活跃',
      unknown: '未知',
      copiedToClipboard: '已复制到剪贴板！',
      failedToCopy: '复制失败',
      recommender: '推荐人:',
      code: '代码:',
      allocationBreakdown: '分配明细',
      sbagPositions: 'SBAG 持仓 (NUMI)',
      sbagPositionsDescription: '您的 SBAG 持仓，实时 NUMI 价格跟踪',
      noSBAGPositions: '未找到 SBAG 持仓',
      loadingSBAGPositions: '加载 SBAG 持仓中...',
      backofficeEntered: '后台已录入',
      investedUSDT: '投资 USDT',
      holdingNUMI: '持有 NUMI',
      avgPriceUSDT: '平均价格 (USDT)',
      holdingUSDT: '持有 USDT',
      currentPriceUSDT: '当前价格 (USDT)',
      availableNUMI: '可用 NUMI',
      unrealizedPL: '未实现盈亏',
      sellDelegation: '卖出委托',
      pendingSells: '待处理卖出',
      sellAmount: '卖出数量 (NUMI)',
      holdingAmount: '持有数量',
      estimatedPL: '预估盈亏',
      slippageWarning: '滑点警告',
      slippageWarningText: '根据市场流动性，卖出时可能发生 5% 至 10% 的滑点。按确认继续卖出委托。',
      confirmSellDelegation: '确认卖出委托',
      positionNotConfirmed: '持仓尚未被后台确认',
      noNUMIAvailable: '没有可用的 NUMI',
      sellDelegationSubmitted: '卖出委托提交成功',
      priceUpdated: '价格更新成功',
      failedToFetchPrice: '获取价格失败',
      failedToRefreshPrice: '刷新价格失败',
      alphaBag: 'Alpha BAG',
      projectAllocation: '项目分配',
      sbagAllocation: 'SBAG分配',
      insuranceAllocation: '保险分配',
      totalAllocation: '总分配',
      copy: '复制',
    },
    community: {
      title: '社区',
      overallTeamPerformance: '整体团队绩效',
      marketLevel: '市场级别',
      teamNode: '团队节点',
      personalPerformance: '个人绩效',
      regionalPerformance: '区域绩效',
      communityPerformance: '社区绩效',
      thirtySky: '30sky',
      totalTeamPerformance: '团队总绩效',
      totalTeamMembers: '团队成员总数',
      myShare: '我的分享',
      numberOfDirectPush: '直接推送数量',
      totalNumberOfTeamMembers: '团队成员总数',
      noDirectReferrals: '暂无直接推荐',
    },
    notFound: {
      title: '糟糕！页面未找到',
      description: '404',
      returnToHome: '返回首页',
    },
    agreement: {
      title: '平台参与及风险确认协议',
      subtitle: '请阅读并同意条款后再继续',
      agreeLabel: '我同意条款和条件',
      agreeButton: '同意',
      section1Title: '1. 平台目的',
      section1Content: '本平台是一个社区平台，旨在支持项目孵化和市场发展。其主要目的是帮助项目提高市场可见性和可持续性，同时通过分散投资策略减少潜在损失，但不包括故意创建的诈骗项目。',
      section2Title: '2. 平台性质',
      section2Content: '本平台仅作为社区驱动的项目支持和协作平台运营。它不构成投资咨询服务、金融机构、资产管理公司或任何形式的担保机制。',
      section3Title: '3. 投资结构和风险',
      section3Intro: '参与者确认并同意：',
      section3Point1: '平台鼓励分散投资作为追求相对稳定资产增长的方法。',
      section3Point2: '投资参与不保证资本的保留或回报。',
      section3Point3: '所有投资都涉及固有风险，包括但不限于市场波动、项目失败、流动性风险、监管风险和技术风险。',
      section4Title: '4. 无担保或资本保护',
      section4Intro: '参与者理解并同意：',
      section4Point1: '平台不提供任何担保或资本保护。',
      section4Point2: '对于通过平台介绍的任何项目，没有义务、授权或强制参与。',
      section4Point3: '平台不为投资结果提供保险、合作或任何形式的财务保护。',
      section5Title: '5. 社区协作',
      section5Intro: '参与者理解并同意：',
      section5Content: '平台作为一个协作社区运作，成员共同寻求降低风险和改善可持续性的方法。所有讨论、消息和共享信息仅供参考，不应被视为财务或法律建议。',
      section6Title: '6. 参与者责任',
      section6Intro: '每位参与者同意：',
      section6Point1: '所有参与和投资决定均由他们自行决定和负责。',
      section6Point2: '在参与任何项目之前，他们已经进行或将进行独立的尽职调查。',
      section6Point3: '平台、其运营商、贡献者和关联方不对任何直接或间接损失承担责任。',
      section7Title: '7. 责任免责',
      section7Intro: '在法律允许的最大范围内：',
      section7Content: '平台及其关联方不对因参与、投资决策或项目结果而产生的任何损失、损害或索赔负责。这包括但不限于财务损失、声誉损害或其他损害。',
      section8Title: '8. 确认和同意',
      section8Intro: '通过参与平台，参与者确认：',
      section8Point1: '他们已经阅读、理解并同意上述所有条款。',
      section8Point2: '他们承认投资决策和参与基于自我责任和风险意识。',
      section8Point3: '他们免除平台提供商的所有索赔和投资担保。',
    },
    introduction: {
      hero: {
        title: '加密生态系统的核心<br/><span>AlphaBag 社区平台</span>',
        p1: 'AlphaBag 并非单一协议或项目，而是连接 <b>交易所 · 媒体 · 项目 · 社区(投资者) · VC</b> 的 <b>社区型市场激活平台</b>。',
        p2: '每个市场都有一线与二线层级，运作逻辑不同。AlphaBag 位于连接所有层级的中立核心位置。',
      },
      why: {
        h: '为什么创建 AlphaBag',
        p1: 'Web3 项目崩塌的原因不止一个。无论技术或愿景如何，外部与内部因素都可能随时导致项目失败。',
        c1h: '技术与安全风险',
        c1p: '黑客攻击、合约漏洞、刻意洗钱等，可能一次事故就摧毁项目。',
        c2h: '资金流动问题',
        c2p: '资金流入过少，或短期涌入巨额资金导致结构失衡，都可能引发崩塌。',
        c3h: '恶意套现',
        c3p: '快速获利、内部抛售、短期激励结构，会迅速摧毁信任。',
        p2: '很多领导者可能在不知问题本质的情况下努力推动项目——直到项目崩塌，带来 <b>信任崩溃</b>，甚至 <b>法律风险</b>。',
        p3: 'AlphaBag 为避免重复这些结构性失败而生：减少单一项目依赖，通过 <b>分散与保险式结构</b> 尽可能降低 <b>本金损失</b>。',
      },
      life: {
        c1h: '项目有生命周期',
        c1p: '没有项目能永远上升，成长与衰退是必然阶段。',
        c2h: '领导者早已在投资',
        c2p: '即使没有平台，多数领导者也会同时参与多个项目。',
        c3h: '很多模式忽视下行',
        c3p: '不少模式追求收益，却把损失风险留给个人承担。',
      },
      core: {
        h: 'AlphaBag 的核心方向',
        p1: 'AlphaBag 先求生存再谈收益，通过分散与保险结构来管理风险。',
        li1: '所有投资都存在风险',
        li2: '避免单一项目依赖',
        li3: '收益与保险并行',
        li4: '链上透明',
        li5: 'DAO / 社区治理',
      },
      com: {
        h: '社区原则与增长策略',
        p1: 'AlphaBag 以"轮动投资"和"极度分散"为核心：基于 100+ 项目信息进行分散参与，并长期保持组织稳定与共同成长。',
        li1: '<b>100+ 项目</b>：避免依赖单一项目，广泛追踪与参与。',
        li2: '<b>轮动</b>：随市场变化降低风险、扩大机会。',
        li3: '<b>组织长期</b>：项目更替不影响组织体系持续运作。',
        p2: '随着用户增长，社区的集体执行力将支持多种收益与对冲方式。',
        li4: '<b>共同铸造/共同参与</b>：在低估项目或 Meme 赛道中追求机会。',
        li5: '<b>对冲</b>：用共同收益缓解波动风险。',
        li6: '<b>空投累积</b>：通过持续参与扩大代币持有机会。',
        p3: '规模扩大后，AlphaBag 计划通过生态代币让所有参与者共享增长；在发币前以 <b>积分制度</b> 给予贡献激励。',
      },
      pos: {
        h: 'AlphaBag 的位置与角色',
        p1: '加密行业是由 <b>交易所 · 媒体 · 项目 · 社区 · VC</b> 共同组成的复杂生态。AlphaBag 目标是成为连接一切的 <b>中心枢纽</b>。',
        c1h: '交易所',
        c1p: '一线交易所通常不会与网络组织或小交易所做表面合作，原因在于竞争关系与体量差异。',
        c2h: '媒体与 VC',
        c2p: '顶级媒体与 VC 需要可信中介，很少直接与未经验证的社区合作。',
        c3h: '社区与项目',
        c3p: '项目需要流动性、交易量与参与者，但往往缺少可持续的市场激活结构。',
        p2: 'AlphaBag 的关键在于：既能对接顶级交易所/媒体/投资机构，又拥有真正推动市场的 <b>组织、领导者与社区</b>。',
        p3: '当项目流动性流失时帮助市场再激活；为新项目创造早期交易与参与；为衰退项目注入新的生命力。',
        p4: '从一线到孵化项目，AlphaBag 立足于最适合协作的交叉位置。',
        mapH: 'AlphaBag 生态示意图',
        mapP: '(文字版中心枢纽结构)',
        mapPre: '        [ 顶级交易所 ]\n  Binance / Coinbase / Upbit\n              │\n[ 顶级媒体与VC ] ── AlphaBag ── [ 社区与领导者 ]\n              │\n       [ 项目与孵化 ]',
      },
      g: {
        h: '全球扩张与中长期愿景',
        p1: 'AlphaBag 正与 <b>20+ 国家</b> 的社区领导者共建国家级分布式社区，打造以 <b>共建者</b> 为核心的生态。',
        li1: '<b>2026 目标</b>：每个国家 1,000+ 核心领导者',
        li2: '<b>活跃用户</b>：以 10 万+ 活跃用户为基础逐步扩张',
        li3: '<b>中期规模</b>：200 万+ 全球参与者',
        p2: '与基金会及合作伙伴共同筛选 Binance Alpha 管线与长期优质项目。',
        li4: '长期资产：<b>ETH, BNB, OKB, SOL</b>',
        li5: '长期 DeFi：挖掘可持续结构（如 Origin 风格的长周期）',
        li6: '新 Alpha：早期但结构优秀的项目',
        p3: '大多数投资很难成为超级成功，但只要一两个（甚至更多）项目成功，资产就可能指数级增长。',
        p4: 'AlphaBag 通过长期、保护与分散来提高成功概率。',
      },
      bag: {
        h: 'AlphaBag BAG 体系',
        p1: 'AlphaBag 不是单一投资模型，而是可随风险偏好与市场变化灵活选择的多层资产运作体系。',
        abag: 'ABAG 是核心安全层：以最可持续的长期 DeFi 设计为目标（持续更新模型，近期上线）。',
        bbag: 'BBAG 以 <b>固定质押</b> + <b>团队/网络收益</b> 为核心，提供 <b>日收益、月收益</b> 等多种模型。',
        cbag: 'CBAG 将约 <b>20%</b> 配置到保护资产/流动性资产，降低下行风险，并支持保险式补偿概念。',
        sbag: 'SBAG 为精选特殊项目区，支持 <b>实时回收本金与收益</b> 的灵活机制。',
        p2: 'BAG 强调风险管理、可持续与本金保护，而非短期噱头。',
      },
      lead: {
        h: '以领导者为中心的结构',
        p1: '领导者希望长期持续领导；投资者希望跟随领导者选择的优质项目，长期保持信任与共同成长。',
        p2: '现实中项目会失败或出现更高收益机会，因此分散投资更符合实际，很多中层领导者早已同时参与多个项目。',
        c1h: '单项目集中风险',
        c1p: '集中可能带来更高收益，但崩塌时风险也更大。',
        c2h: '投资者口味不同',
        c2p: '保守与激进并存，单一项目无法满足所有人。',
        c3h: '需要可信中介',
        c3p: '投资者需要更快信息、更强验证（创始人/技术）与更好的分散选择。',
        p3: 'AlphaBag 计划汇聚媒体、VC、交易所、影响者、法律与金融等专家节点，过滤恶意或结构缺陷项目。',
        p4: '对领导者而言，AlphaBag 目标是保留组织腿（leg），项目可水平迁移，无需反复重建团队，实现周期性自动变现。',
        p5: '核心是组织持续性与信任驱动的长期运作。',
      },
      inv: {
        h: '投资现实与 AlphaBag 哲学',
        p1: '投资无法保证 100% 收益。很多 Web3 结构更像从投资者身上获取价值，而非回馈投资者。',
        p2: '市场是自由交易环境，高位进场被套很常见。',
        p3: '收益常来自低位布局与高位兑现，以及多样化策略工具。',
        p4: 'AlphaBag 追求稳健增值：尽快低位进入，增长后再寻找新的低位区域重复布局。',
        p5: '同时小比例配置 Meme 等高风险高收益赛道，用偶发大收益推动整体增长。',
        p6: 'AlphaBag 的目标是把来之不易的信任关系转化为平台内可持续收益结构，打造跨世代的去中心化社区——让用户共同增值，而不是被利用。',
      },
      fin: {
        h: '最后寄语',
        p1: '犹豫的朋友与领导者们：市场最终会走向 AlphaBag 这样的社区投资平台。',
        p2: '关键不在是否加入，而在 <b>多早加入</b>。越早越能建立更强下级网络，更早进入复利增长队列。',
        p3: 'AlphaBag 不是短期潮流，而是长期让领导者与社区共同成长的结构。',
      },
      foot: '© AlphaBag 社区平台. 版权所有.',
    },
  },
  ko: {
    header: {
      connectWallet: '지갑 연결',
      connected: '연결됨',
    },
    staking: {
      investmentPlatform: '투자 플랫폼',
      title: '분산형 ',
      titleHighlight: '온체인',
      description: '분산형 온체인 재무 관리 프로토콜은 DAO, Web3 프로젝트 및 커뮤니티가 투명하고 자율적으로 온체인에서 재무 자원을 안전하게 관리, 할당 및 실행할 수 있도록 하는 블록체인 기반 시스템입니다.',
      investmentStrategy: 'AlphaBag에 투자된 프로젝트는 분산 투자를 통해 안전하게 수익을 증가시키는 것을 목표로 합니다. 일반 플랜은 BBAG, SBAG (Binance Alpha), CBAG 분산 투자를 권장합니다. 셀프컬렉션 플랜은 선택한 단일 지갑으로 100% 전송됩니다.',
      amountToInvest: '투자 금액',
      max: '최대',
      invest: '투자',
      approving: '승인 중...',
      confirming: '확인 중...',
      investing: '투자 중...',
      switchToBSC: 'BSC 메인넷으로 전환',
      tokenNotAvailable: '토큰을 사용할 수 없음',
      insufficientBalance: '잔액 부족',
      enterValidAmount: '유효한 금액을 입력하세요',
      pleaseConnectWallet: '지갑을 연결하세요',
      investmentFailed: '투자 실패',
      successfullyInvested: '투자 성공',
      binanceAlpha: 'BINANCE Alpha +',
      insuranceHedge: '보험(헤지)',
      chooseLikeCart: '카트처럼 선택',
      dailyProfit: '일일 수익',
      recommended: '권장:',
      details: '세부 정보',
      goToWebsite: '웹사이트로 이동',
      prepareParticipation: '참여 준비',
      addToInvestmentList: '투자 목록에 추가',
      referralCodeRequired: '추천 코드 필요',
      referralCodeRequiredDesc: '투자를 진행하기 전에 추천 코드를 입력하라는 팝업 메시지가 나타납니다. 추천 코드가 이미 등록되어 있으면 프로세스가 계속됩니다. 추천 코드가 등록되지 않은 경우 투자 전에 등록하라는 메시지가 표시됩니다.',
      registerReferralCode: '추천 코드 등록',
      projectAddedToList: '프로젝트가 투자 목록에 추가됨',
      projectAddedToListDesc: '프로젝트가 투자 목록에 추가되었습니다. 투자 프로세스를 계속할 수 있습니다.',
    },
    userStakes: {
      yourInvestments: '귀하의 투자',
      managePositions: '투자 포지션 관리',
      totalInvested: '총 투자액',
      totalRewards: '총 보상',
      activeInvestments: '활성 투자',
      claimedInvestments: '청구된 투자',
      invested: '투자됨',
      activeStakes: '활성 투자',
      claimedStakes: '청구된 투자',
      total: '총계',
      rewards: '보상',
      investmentNumber: '투자 #',
      investedAmount: '투자 금액',
      pendingRewards: '대기 중인 보상',
      unlocksIn: '잠금 해제 시간',
      unlocked: '잠금 해제됨',
      ready: '준비됨',
      days: '일',
      unlockDate: '잠금 해제 날짜',
      claim: '청구',
      claiming: '청구 중...',
      claimed: '청구됨',
      locked: '잠김',
      noInvestments: '투자 없음',
      noInvestmentsDesc: '아직 투자가 없습니다. 보상을 받기 위해 투자를 시작하세요!',
      stakedAmount: '투자 금액',
      rewardsClaimed: '청구된 보상',
      status: '상태',
    },
    referral: {
      yourReferralLink: '귀하의 추천 링크',
      shareDescription: '추천 링크를 공유하고 다른 사람이 귀하의 코드를 사용하여 가입할 때 보상을 받으세요',
      yourReferralCode: '귀하의 추천 코드',
      joinAlphaBag: 'AlphaBag 투자에 참여',
      joinText: 'AlphaBag 투자에 참여하여 보상을 받기 시작하세요!',
      youWereReferred: '코드로 추천받았습니다',
      registrationTitle: '추천 코드 등록',
      alphaBagTitle: 'Alpha BAG',
      registrationDescription: '프로젝트별로 추천 링크를 붙여넣고 편집하여 저장하세요. 저장된 추천 링크를 복사하여 추천인과 공유하세요.',
      copySelected: '선택 항목 복사',
      saveAll: '모두 저장',
      resetAll: '모두 재설정',
      saved: '저장됨',
      statusIdle: '상태: 대기 중',
      statusIdleDescription: '각 프로젝트에 대한 추천 링크를 입력하고 저장하세요.',
      projectMaxFi: 'MaxFi',
      projectLoomX: 'LoomX (LoomX)',
      projectCodexField: 'CodexField',
      maxFiUrl: 'https://www.maxfi.io/?ref=...',
      loomXUrl: 'https://app.loom-x.com/?ref=...',
      codexFieldUrl: 'https://app.codexfield.co/?ref=...',
      enterReferralLink: '추천 링크 입력',
      linkSaved: '링크 저장 성공',
      linkCopied: '링크가 클립보드에 복사되었습니다',
      linkDeleted: '링크 삭제됨',
      allLinksSaved: '모든 링크 저장 성공',
      allLinksReset: '모든 링크 재설정됨',
      selectProjects: '복사할 프로젝트 선택',
    },
    footer: {
      copyright: '© 2025 AlphaBag 투자. 모든 권리 보유.',
    },
    common: {
      usdt: 'USDT',
    },
    projects: {
      viewDetails: '세부 정보 보기',
      goToDApp: '이 프로젝트의 DApp으로 직접 이동',
      minInvestment: '최소 투자액: $250',
      bbagb: 'B-BAGB',
      sbag: 'S-SBAG BAG',
      cbag: 'C-BAG',
      maxfi: 'MaxFi',
      numine: 'Numine',
      insurance: '보험',
      maxfiProject: {
        focus: '안정적 / 재무부 중심',
        description: 'Telegram에서 시작하여 온체인에서 완료되는 비수탁 거래 봇. 일일 수익 0.6%-2%. 원금은 언제든지 인출 가능.',
        quickActionsDescription: '비수탁 + 온체인 결제 및 유연한 원금 인출.',
        tags: {
          binanceAlpha: '바이낸스 Alpha',
          nonCustodial: '비수탁',
          tradingBot: '거래 봇',
        },
      },
      roomx: {
        focus: '성장 / 균형',
        description: '크로스체인 + 비수탁 거래 봇. 일일 1.8%. 수익 실현 후 원금 반환. 수익이 5 USDT에 도달하면 지갑으로 자동 지급.',
        quickActionsDescription: '크로스체인 실행 및 자동 지급 메커니즘(5 USDT 임계값).',
        tags: {
          binanceAlpha: '바이낸스 Alpha',
          crossChain: '크로스체인',
          tradingBot: '거래 봇',
        },
      },
      codexfield: {
        focus: '전략 / 구조화',
        description: 'CodexField는 Web3 콘텐츠 및 AI 자산 거래 플랫폼의 핵심 토큰입니다. 바이낸스 랩스 지원. 일일 수익률 1%.',
        quickActionsDescription: '콘텐츠/AI 자산 서사 강조 + 바이낸스 랩스 지원.',
        tags: {
          binanceAlpha: '바이낸스 Alpha',
          web3: 'Web3',
          aiAssets: 'AI 자산',
        },
      },
    },
    investment: {
      title: '투자',
      investmentStatus: '투자 상태',
      successPopup: '투자가 완료된 후 성공 팝업을 표시하고 나머지 40% 수동 투자에 대한 지침을 제공합니다.',
      remaining40Manual: '나머지 40% 수동 투자',
      remaining40Description: '현재 BBAG 프로젝트와 통합 중입니다. 통합이 완료될 때까지 아래 링크를 사용하여 프로젝트 DApp에 들어가 지갑에 남은 40% 자금으로 수동으로 투자를 완료하세요.',
      projectDAppUrl: '프로젝트 DApp URL',
      copy: '복사',
      openDApp: 'DApp 열기',
      remaining40Funds: '나머지 40% 자금 (참고)',
      remaining40FundsDesc: '지갑 잔액을 확인하고 DApp에서 수동 투자를 완료하세요',
      disclaimer: '* 통합이 완료되면 이 지침이 자동 투자로 변경될 수 있습니다.',
      testSuccessPopup: '성공 팝업 테스트',
      integrationStatus: '통합 상태',
      currentStep: '현재 단계',
      currentStepDesc: '40% 수동 투자 필요',
      support: '지원',
      supportDesc: '문제가 발생하면 운영 팀에 문의하세요',
      integratingWithBBAG: 'BBAG와 통합 중',
      notYetConnected: '아직 연결되지 않음',
      urlCopied: 'DApp URL이 클립보드에 복사되었습니다!',
      copyFailed: 'URL 복사 실패',
      invalidUrl: '유효한 DApp URL을 입력하세요',
      investmentSuccessful: '투자 성공!',
      investmentCompleted: '투자가 성공적으로 완료되었습니다.',
      gotIt: '알겠습니다',
      dappUrlPlaceholder: 'https://YOUR-DAPP-LINK-HERE',
    },
    projectDetails: {
      title: '프로젝트 세부 정보',
      description: '프로젝트 설명',
      relatedMaterials: '관련 자료',
      watchVideo: '동영상 보기',
      telegram: 'Telegram',
      twitter: 'Twitter',
      close: '닫기',
      quickActions: '빠른 작업',
      resources: '리소스',
      video: '비디오',
      blog: '블로그',
      keyMetrics: '핵심 지표',
      detailInfo: '상세 정보',
      auditInfo: '감사(Audit) 정보',
      youtubeVideo: 'YouTube 영상',
      referenceMaterials: '참고 자료',
    },
    profile: {
      title: '프로필',
      connectWallet: '지갑 연결',
      connectWalletDescription: '프로필을 보려면 지갑을 연결하세요',
      myNodes: '내 노드',
      myNodesDescription: '구매한 모든 노드 보기',
      noNodesYet: '아직 노드를 구매하지 않았습니다',
      myTotalInvestment: '내 총 투자',
      myTotalInvestmentDescription: '플랫폼의 총 투자',
      totalInvestedAmount: '총 투자 금액',
      separateInvestmentContract: '별도 투자 계약',
      separateInvestmentContractDescription: '별도 투자 계약의 투자',
      loadingInvestmentData: '투자 데이터 로딩 중...',
      invested: '투자됨',
      investedInContract: '이 계약에 투자했습니다',
      investmentDetails: '투자 세부 정보',
      investmentId: '투자 ID:',
      amount: '금액:',
      token: '토큰:',
      notInvestedInContract: '아직 이 계약에 투자하지 않았습니다',
      walletBalance: '지갑 잔액',
      walletBalanceDescription: '현재 USDT 잔액',
      availableForInvestment: '투자 가능',
      price: '가격:',
      nodeId: '노드 ID:',
      active: '활성',
      unknown: '알 수 없음',
      copiedToClipboard: '클립보드에 복사되었습니다!',
      failedToCopy: '복사 실패',
      recommender: '추천인:',
      code: '코드:',
      allocationBreakdown: '할당 내역',
      sbagPositions: 'SBAG 포지션 (NUMI)',
      sbagPositionsDescription: '실시간 NUMI 가격 추적이 포함된 SBAG 포지션',
      noSBAGPositions: 'SBAG 포지션을 찾을 수 없습니다',
      loadingSBAGPositions: 'SBAG 포지션 로딩 중...',
      backofficeEntered: '백오피스 입력됨',
      investedUSDT: '투자 USDT',
      holdingNUMI: '보유 NUMI',
      avgPriceUSDT: '평균 가격 (USDT)',
      holdingUSDT: '보유 USDT',
      currentPriceUSDT: '현재 가격 (USDT)',
      availableNUMI: '사용 가능한 NUMI',
      unrealizedPL: '미실현 손익',
      sellDelegation: '매도 위탁',
      pendingSells: '대기 중인 매도',
      sellAmount: '매도 수량 (NUMI)',
      holdingAmount: '보유 수량',
      estimatedPL: '예상 손익',
      slippageWarning: '슬리피지 경고',
      slippageWarningText: '시장 유동성에 따라 매도 시 5%~10%의 슬리피지가 발생할 수 있습니다. 확인을 눌러 매도 위탁을 진행하세요.',
      confirmSellDelegation: '확인 (매도 위탁)',
      positionNotConfirmed: '백오피스에서 아직 확인되지 않은 포지션',
      noNUMIAvailable: '판매할 NUMI가 없습니다',
      sellDelegationSubmitted: '매도 위탁이 성공적으로 제출되었습니다',
      priceUpdated: '가격이 성공적으로 업데이트되었습니다',
      failedToFetchPrice: '가격 가져오기 실패',
      failedToRefreshPrice: '가격 새로고침 실패',
      alphaBag: 'Alpha BAG',
      projectAllocation: '프로젝트 할당',
      sbagAllocation: 'SBAG 할당',
      insuranceAllocation: '보험 할당',
      totalAllocation: '총 할당',
      copy: '복사',
    },
    community: {
      title: '커뮤니티',
      overallTeamPerformance: '전체 팀 성과',
      marketLevel: '시장 레벨',
      teamNode: '팀 노드',
      personalPerformance: '개인 성과',
      regionalPerformance: '지역 성과',
      communityPerformance: '커뮤니티 성과',
      thirtySky: '30sky',
      totalTeamPerformance: '총 팀 성과',
      totalTeamMembers: '팀원 총 수',
      myShare: '내 공유',
      numberOfDirectPush: '직접 추천 수',
      totalNumberOfTeamMembers: '팀원 총 수',
      noDirectReferrals: '직접 추천이 아직 없습니다',
    },
    notFound: {
      title: '앗! 페이지를 찾을 수 없습니다',
      description: '404',
      returnToHome: '홈으로 돌아가기',
    },
    agreement: {
      title: '플랫폼 참여 및 위험 확인 협약',
      subtitle: '계속하기 전에 약관을 읽고 동의해 주세요',
      agreeLabel: '약관 및 조건에 동의합니다',
      agreeButton: '동의',
      section1Title: '1. 플랫폼 목적',
      section1Content: '이 플랫폼은 프로젝트 인큐베이션 및 시장 개발을 지원하기 위해 설계된 커뮤니티 기반 플랫폼입니다. 주요 목적은 고의로 사기로 만든 프로젝트를 제외하고, 분산 투자 전략을 통해 잠재적 손실을 줄이면서 프로젝트의 시장 가시성과 지속 가능성을 향상시키는 것입니다.',
      section2Title: '2. 플랫폼 성격',
      section2Content: '플랫폼은 단순히 커뮤니티 주도의 프로젝트 지원 및 협업 플랫폼으로 운영됩니다. 이는 투자 자문 서비스, 금융 기관, 자산 관리자 또는 어떤 형태의 보장 메커니즘도 구성하지 않습니다.',
      section3Title: '3. 투자 구조 및 위험',
      section3Intro: '참가자는 다음을 확인하고 동의합니다:',
      section3Point1: '플랫폼은 상대적으로 안정적인 자산 성장을 추구하는 방법으로 분산 투자를 권장합니다.',
      section3Point2: '투자 참여는 자본의 보존 또는 반환을 보장하지 않습니다.',
      section3Point3: '모든 투자에는 시장 변동성, 프로젝트 실패, 유동성 위험, 규제 위험 및 기술 위험을 포함하되 이에 국한되지 않는 고유한 위험이 따릅니다.',
      section4Title: '4. 보장 또는 자본 보호 없음',
      section4Intro: '참가자는 다음을 이해하고 동의합니다:',
      section4Point1: '플랫폼은 어떤 보장이나 자본 보호도 제공하지 않습니다.',
      section4Point2: '플랫폼을 통해 소개된 어떤 프로젝트에도 의무, 위임 또는 강제 참여가 없습니다.',
      section4Point3: '플랫폼은 투자 결과에 대한 보험, 협력 또는 어떤 형태의 재정적 보호도 제공하지 않습니다.',
      section5Title: '5. 커뮤니티 협업',
      section5Intro: '참가자는 다음을 이해하고 동의합니다:',
      section5Content: '플랫폼은 회원들이 위험을 줄이고 지속 가능성을 개선하는 방법을 공동으로 모색하는 협업 커뮤니티로 기능합니다. 모든 논의, 메시지 및 공유 정보는 참고 목적으로만 제공되며 재정 또는 법적 조언으로 간주되어서는 안 됩니다.',
      section6Title: '6. 참가자 책임',
      section6Intro: '각 참가자는 다음에 동의합니다:',
      section6Point1: '모든 참여 및 투자 결정은 자신의 재량과 책임으로 이루어집니다.',
      section6Point2: '어떤 프로젝트에 참여하기 전에 독립적인 실사 조사를 수행했거나 수행할 것입니다.',
      section6Point3: '플랫폼, 운영자, 기여자 및 제휴 당사자는 직접 또는 간접 손실에 대해 책임을 지지 않습니다.',
      section7Title: '7. 책임 제한',
      section7Intro: '적용 가능한 법률에서 허용하는 최대 범위까지:',
      section7Content: '플랫폼 및 관련 당사자는 참여, 투자 결정 또는 프로젝트 결과로 인한 모든 손실, 손해 또는 청구에 대해 책임을 지지 않습니다. 여기에는 재정적 손실, 평판 손상 또는 기타 손해가 포함되지만 이에 국한되지 않습니다.',
      section8Title: '8. 확인 및 동의',
      section8Intro: '플랫폼에 참여함으로써 참가자는 다음을 확인합니다:',
      section8Point1: '위에 명시된 모든 약관을 읽고 이해했으며 동의했습니다.',
      section8Point2: '투자 결정과 참여는 자기 책임과 위험 인식을 기반으로 한다는 것을 인정합니다.',
      section8Point3: '플랫폼 제공자로부터 모든 청구 및 투자 보장을 해제합니다.',
    },
    introduction: {
      hero: {
        title: '암호화폐 생태계의 중심<br/><span>AlphaBag Community Platform</span>',
        p1: 'AlphaBag은 하나의 프로토콜이나 단일 프로젝트가 아닙니다. 거래소 · 미디어 · 프로젝트 · 커뮤니티(투자자) · VC를 연결하는 커뮤니티 기반 시장 활성화 플랫폼입니다.',
        p2: '모든 시장에는 1티어와 2티어가 존재하고, 각 티어는 서로 다른 논리와 체급으로 움직입니다. AlphaBag은 이 모든 층위를 연결할 수 있는 가장 중립적이면서도 강력한 위치에 서 있습니다.',
      },
      why: {
        h: '왜 AlphaBag이 만들어졌는가',
        p1: 'Web3 시장에서 프로젝트가 무너지는 이유는 단 하나가 아닙니다. 기술력이나 비전과 무관하게 다양한 외부·내부 요인으로 프로젝트는 언제든 붕괴될 수 있습니다.',
        c1h: '기술·보안 리스크',
        c1p: '해킹, 컨트랙트 취약점, 의도적 자금 세탁 등은 단 한 번의 사고로 프로젝트를 무너뜨릴 수 있습니다.',
        c2h: '자금 흐름 문제',
        c2p: '자금 유입이 지나치게 적거나, 반대로 대규모 자금이 단기간에 유입되며 구조가 붕괴되는 경우도 빈번합니다.',
        c3h: '악의적 수익 실현',
        c3p: '빠른 차익 실현, 내부자의 악의적인 매도, 단기 수익을 노린 구조는 프로젝트의 신뢰를 급격히 붕괴시킵니다.',
        p2: '이러한 상황에서 리더들은 문제의 본질을 인지하지 못한 채 열심히 활동하며 수익을 만들어내는 것처럼 보일 수 있습니다. 그러나 프로젝트가 무너지는 순간 <b>신뢰 상실</b>은 물론이고, 경우에 따라서는 <b>법적 리스크</b>까지 떠안게 됩니다.',
        p3: 'AlphaBag은 이러한 구조적 문제를 반복하지 않기 위해 만들어졌습니다. 단일 프로젝트 의존을 피하고, <b>분산 투자와 보험 투자</b>라는 구조를 통해 가능한 한 <b>원금 손실을 방지</b>하며 자산을 운영하는 것을 목표로 합니다.',
      },
      life: {
        c1h: '프로젝트는 생명주기를 가진다',
        c1p: '어떤 프로젝트도 영원하지 않으며, 성장과 쇠퇴는 필연적인 과정입니다.',
        c2h: '리더들은 이미 투자하고 있다',
        c2p: '플랫폼이 소개하지 않아도 대부분의 리더는 이미 다양한 프로젝트를 선택하고 진행합니다.',
        c3h: '손실을 관리하지 않는 구조',
        c3p: '기존 투자 방식은 수익에 집중하고 손실 관리는 개인에게 맡겨지는 경우가 많습니다.',
      },
      core: {
        h: 'AlphaBag의 핵심 방향',
        p1: 'AlphaBag은 수익보다 먼저 생존을 고민합니다. 분산 투자와 보험 구조를 통해 리스크를 관리합니다.',
        li1: '모든 투자는 손실 가능성을 전제로 설계',
        li2: '단일 프로젝트 의존 배제',
        li3: '수익 + 보험(Protection) 병행 구조',
        li4: '온체인 투명성',
        li5: 'DAO·커뮤니티 주도 의사결정',
      },
      com: {
        h: 'AlphaBag 커뮤니티 운영 원칙과 성장 전략',
        p1: 'AlphaBag 커뮤니티는 \'손바뀜 투자(Portfolio Rotation)\'와 \'초분산 투자\'라는 원칙을 중심에 둡니다. 100개 이상의 프로젝트 정보를 기반으로 분산 참여하며, 한 번 만들어진 조직을 오랜 기간 유지하고 함께 성장하는 것을 목표로 합니다.',
        li1: '<b>100+ 프로젝트 분산 참여</b>: 특정 1개 프로젝트에 의존하지 않고 다수의 프로젝트를 동시에 추적·참여합니다.',
        li2: '<b>손바뀜 투자(로테이션)</b>: 시장 환경 변화에 따라 위험을 줄이고 기회를 넓히는 방향으로 포트폴리오를 재조정합니다.',
        li3: '<b>조직의 장기 유지</b>: 프로젝트가 바뀌어도 커뮤니티 운영 체계는 유지되도록 설계합니다.',
        p2: '유저가 충분히 모이면, 커뮤니티의 집단 실행력을 바탕으로 다양한 방식의 수익 및 리스크 헤지 전략을 추진합니다.',
        li4: '<b>공동 민트/공동 참여</b>: 저평가 프로젝트 또는 밈 코인 영역에서 공동 민트 및 공동 참여로 수익을 추구합니다.',
        li5: '<b>리스크 헤지</b>: 공동 수익을 활용해 변동성 리스크를 완화하고 장기적으로 안정적 운영을 지향합니다.',
        li6: '<b>에어드랍 기반 누적</b>: 지속적인 에어드랍 참여로 참여자의 토큰 보유 기회를 확장합니다.',
        p3: '커뮤니티 규모가 커지면 토큰 발행을 통해 참여자 모두가 성장의 과실을 공유하도록 설계합니다. 토큰 발행 전에는 <b>AlphaBag 포인트 제도</b>로 활동과 기여에 따른 혜택을 제공합니다.',
      },
      pos: {
        h: 'AlphaBag의 위치와 역할',
        p1: '암호화폐 산업은 <b>거래소 · 미디어 · 프로젝트 · 커뮤니티 · VC</b>가 서로 다른 이해관계로 움직이는 복합 생태계입니다. AlphaBag은 이 모든 영역의 <b>중심 허브</b>를 목표로 합니다.',
        c1h: '거래소 (Exchange)',
        c1p: 'Binance 같은 1티어 거래소는 경쟁 구조와 체급 차이로 인해 네트워크형 조직이나 하위 거래소와 표면적 파트너십을 맺지 않는 경우가 많습니다.',
        c2h: '미디어 & VC',
        c2p: '탑 미디어와 탑 VC는 검증되지 않은 커뮤니티와 직접 협력하지 않습니다. 신뢰 가능한 매개체가 필요합니다.',
        c3h: '커뮤니티 & 프로젝트',
        c3p: '프로젝트는 유동성·거래량·참여자가 필요하지만, 이를 지속적으로 유지할 구조가 부족한 경우가 많습니다.',
        p2: 'AlphaBag이 중요한 이유는 명확합니다. <b>탑 거래소·탑 미디어·탑 투자사와 협력 가능한 위치</b>에 있으면서, 동시에 시장을 움직이는 <b>조직과 리더, 커뮤니티</b>를 보유하기 때문입니다.',
        p3: 'AlphaBag의 목표는 유동성이 빠질 때 시장을 다시 활성화하고, 막 시작하는 프로젝트에는 초기 거래·참여를 만들며, 죽어가는 프로젝트에는 다시 생명을 불어넣는 것입니다.',
        p4: '결국 모든 산업의 핵심은 <b>조직과 리더</b>입니다. AlphaBag은 1티어부터 인큐베이팅 단계의 프로젝트까지 모두가 협력할 수 있는 최적의 교차 지점을 지향합니다.',
        mapH: 'AlphaBag Ecosystem Map',
        mapP: '(중앙 허브 구조 – 텍스트 기반 표현)',
        mapPre: '        [ Top Exchanges ]\n  Binance / Coinbase / Upbit\n              │\n[ Top Media & VC ] ── AlphaBag ── [ Community & Leaders ]\n              │\n     [ Projects & Incubation ]',
      },
      g: {
        h: '글로벌 확장과 중장기 비전',
        p1: 'AlphaBag은 현재 <b>20개국 이상의 커뮤니티 리더</b>들과 함께 국가 단위의 분산형 커뮤니티를 구축하며, <b>공동 구성원(Co-builders)</b> 중심의 생태계를 만들어가고 있습니다.',
        li1: '<b>2026년 목표</b>: 국가별 1,000명 이상의 핵심 리더 육성',
        li2: '<b>글로벌 유저 목표</b>: 10만 명 이상의 활성 유저 기반 단계적 확장',
        li3: '<b>중장기 커뮤니티 규모</b>: 총 200만 명 이상의 글로벌 참여자 확보',
        p2: '재단 및 파트너와 협력하여 <b>Binance Alpha 대기 프로젝트(약 10개)</b> 및 장기 우수 프로젝트를 선별하고 있습니다.',
        li4: '장기 성장 자산: <b>ETH, BNB, OKB, SOL</b> 등 검증된 메이저 자산',
        li5: '장기 운용형 DeFi: Origin처럼 오랜 기간 지속 가능한 구조의 DeFi 프로젝트 발굴',
        li6: '신규 Alpha 기회: 초기 단계지만 구조적으로 우수한 프로젝트 발굴',
        p3: '대부분의 투자가 큰 성공을 만들기는 어렵지만, <b>하나 또는 두 개, 더 나아가 여러 프로젝트가 성공한다면</b> 자산은 기하급수적으로 성장할 수 있습니다.',
        p4: '사례로 Origin 프로젝트는 장기 구조에서 큰 성과를 만든 케이스로 언급됩니다. AlphaBag은 \'장기 생존 + 구조적 보호 + 분산\'이라는 방향으로 비슷한 성과 가능성을 높이는 것을 지향합니다.',
      },
      bag: {
        h: 'AlphaBag BAG 시스템',
        p1: 'AlphaBag은 단일 투자 모델이 아닌, 리스크 성향과 시장 상황에 따라 선택 가능한 <b>다층적 자산 운용 구조</b>로 설계되어 있습니다.',
        abag: 'ABAG는 AlphaBag의 핵심 안전 장치입니다. 가장 안전하고 장기 지속 가능한 DeFi 모델로 설계되었으며, 현재 금융 전문가들과 모델을 업데이트 중이며 곧 출시 예정입니다.',
        bbag: 'BBAG는 <b>팀·네트워크 수익 중심</b> 메인 구간입니다. <b>고정 스테이킹</b> 기반 안정적 증식 + 프로젝트별 팀/네트워크 수익 구조로 <b>데일리·월 수익</b> 등 다양한 수익 모델을 제공합니다.',
        cbag: 'CBAG는 전체 자산 중 약 <b>20%</b>를 BTC 등 보호 자산/유동성 자산에 배치하여 리스크를 완화하고, 손실 발생 시 <b>보험 개념 보상 메커니즘</b>을 지향합니다.',
        sbag: 'SBAG는 스페셜 프로젝트 구간이며, <b>실시간으로 원금과 수익을 회수</b>할 수 있는 유연한 회수 구조를 지향합니다.',
        p2: 'BAG 시스템은 단기 수익보다 <b>리스크 관리 · 지속성 · 자산 보호</b>를 우선으로 설계되며, 시장 상황에 따라 유연한 운용 확장을 지향합니다.',
      },
      lead: {
        h: 'AlphaBag의 목표와 리더 중심 구조',
        p1: '리더는 한 번 리더가 되면 계속 리더로 활동하고 싶고, 리더를 따라온 투자자는 좋은 프로젝트를 통해 지속적으로 감사와 신뢰를 느끼며 함께하고 싶습니다.',
        p2: '그러나 프로젝트 붕괴 또는 더 나은 수익률의 신규 프로젝트 등장 시, 투자자 입장에서는 <b>다양한 프로젝트 분산 투자</b>가 현실적이며 많은 중간급 리더는 이미 여러 프로젝트에 참여합니다.',
        c1h: '집중형 리더의 리스크',
        c1p: '하나의 프로젝트 집중은 큰 수익 기회가 있는 만큼, 붕괴 시 감당해야 할 리스크 또한 큽니다.',
        c2h: '투자자의 다양성',
        c2p: '투자자는 성향이 다르며 하나의 프로젝트로 모두를 만족시키기 어렵습니다.',
        c3h: '신뢰 가능한 매개체',
        c3p: '투자자는 분산 투자와 빠른 정보, 오너·기술진 검증이 가능한 신뢰 매개체를 원합니다.',
        p3: 'AlphaBag은 미디어, VC, 거래소, 인플루언서, 법조·금융 등 다양한 전문가 노드가 참여하여 악의적/오설계 프로젝트를 검증·필터링하는 구조를 지향합니다.',
        p4: '또한 리더는 기존처럼 사업이 바뀔 때마다 산하 조직을 재건할 필요 없이, 한 번 정해진 조직 레그를 기반으로 다양한 사업이 수평 이동하며 자동 수익화가 이어지는 구조를 목표로 합니다.',
        p5: '이 모든 과정에서 핵심은 \'조직의 지속성\'과 \'신뢰 기반의 장기 운용\'입니다.',
      },
      inv: {
        h: '투자의 현실과 AlphaBag의 철학',
        p1: '투자는 <b>100% 수익을 보장할 수 없습니다</b>. 많은 Web3 프로젝트는 투자자 이익보다 투자자를 활용해 내부 수익을 얻는 구조가 존재합니다.',
        p2: '금융시장은 주식과 마찬가지로 자율 거래 시장이며, 고점 진입으로 물리는 경우도 흔합니다.',
        p3: '시장은 저점 진입과 고점 실현, 다양한 거래 옵션으로 수익이 만들어지는 구조가 많습니다.',
        p4: 'AlphaBag 커뮤니티는 가능한 한 빠르게 저점에 진입하고, 자산이 성장하면 다시 저가 구간을 찾아 재진입하는 <b>안정적 자산 증식</b>을 목표로 합니다.',
        p5: '동시에 일부 자산은 소규모로 밈 코인 등 고위험·고수익 영역에 배치하여, 가끔 발생하는 큰 수익 기회로 전체 성장을 보조합니다.',
        p6: 'AlphaBag의 목적은 어렵게 구축한 리더-투자자 신뢰 관계를 한 플랫폼에서 지속 수익 구조로 연결하고, 세대를 넘어 이어질 수 있는 안정적인 탈중심화 커뮤니티로 성장하는 것입니다.',
      },
      fin: {
        h: '마지막으로 드리는 메시지',
        p1: 'AlphaBag 참여를 망설이는 분들과 리더 여러분, 시장은 결국 AlphaBag과 같은 커뮤니티 투자 플랫폼에 합류하게 될 것입니다.',
        p2: '중요한 것은 참여 여부가 아니라 <b>얼마나 빠르게 합류</b>하느냐입니다. 빠를수록 산하 추천인을 확보하고 자산을 늘려가는 대열에 앞서 설 수 있습니다.',
        p3: 'AlphaBag은 단기 유행이 아니라, 장기적으로 리더와 커뮤니티가 함께 성장하는 구조를 지향합니다.',
      },
      foot: '© AlphaBag 커뮤니티 플랫폼. All rights reserved.',
    },
  },
  ja: {
    header: {
      connectWallet: 'ウォレット接続',
      connected: '接続済み',
    },
    staking: {
      investmentPlatform: '投資プラットフォーム',
      title: '分散型 ',
      titleHighlight: 'オンチェーン',
      description: '分散型オンチェーン資産管理プロトコルは、DAO、Web3プロジェクト、コミュニティが透明かつ自律的に資金をオンチェーンで安全に管理・配分・実行できるブロックチェーンベースのシステムです。',
      investmentStrategy: 'AlphaBagに投資するプロジェクトは、分散投資を通じて安全に利益を増やすことを目的としています。標準プランはBBAG、SBAG（Binance Alpha）、CBACの分散投資を推奨します。セルフコレクションプランは100%を任意の単一ウォレットに送信します。',
      amountToInvest: '投資金額',
      max: '最大',
      invest: '投資',
      approving: '承認中...',
      confirming: '確認中...',
      investing: '投資中...',
      switchToBSC: 'BSCメインネットに切り替え',
      tokenNotAvailable: 'トークン利用不可',
      insufficientBalance: '残高不足',
      enterValidAmount: '有効な金額を入力してください',
      pleaseConnectWallet: 'ウォレットを接続してください',
      investmentFailed: '投資に失敗しました',
      successfullyInvested: '投資が完了しました',
      binanceAlpha: 'BINANCE Alpha +',
      insuranceHedge: 'インシュアランス(ヘッジ)',
      chooseLikeCart: 'カートのように選択',
      dailyProfit: '日次利益',
      recommended: '推奨:',
      details: '詳細',
      goToWebsite: 'ウェブサイトへ',
      prepareParticipation: '参加準備',
      addToInvestmentList: '投資リストに追加',
      referralCodeRequired: '紹介コードが必要です',
      referralCodeRequiredDesc: '投資を進める前に紹介コードの入力を求めるポップアップが表示されます。紹介コードが既に登録されている場合はそのまま続行します。未登録の場合は投資前に登録が必要です。',
      registerReferralCode: '紹介コードを登録',
      projectAddedToList: 'プロジェクトが投資リストに追加されました',
      projectAddedToListDesc: 'プロジェクトが投資リストに追加されました。投資手続きを進めることができます。',
    },
    userStakes: {
      yourInvestments: 'あなたの投資',
      managePositions: '投資ポジションを管理',
      totalInvested: '総投資額',
      totalRewards: '総報酬',
      activeInvestments: 'アクティブな投資',
      claimedInvestments: '請求済み投資',
      invested: '投資済み',
      activeStakes: 'アクティブな投資',
      claimedStakes: '請求済み投資',
      total: '合計',
      rewards: '報酬',
      investmentNumber: '投資番号 #',
      investedAmount: '投資額',
      pendingRewards: '保留中の報酬',
      unlocksIn: 'ロック解除まで',
      unlocked: 'ロック解除済み',
      ready: '準備完了',
      days: '日',
      unlockDate: 'ロック解除日',
      claim: '請求',
      claiming: '請求中...',
      claimed: '請求済み',
      locked: 'ロック中',
      noInvestments: '投資なし',
      noInvestmentsDesc: 'まだ投資がありません。投資を始めて報酬を獲得しましょう！',
      stakedAmount: 'ステーク額',
      rewardsClaimed: '請求済み報酬',
      status: 'ステータス',
    },
    referral: {
      yourReferralLink: '紹介リンク',
      shareDescription: '紹介リンクを共有して、コードを使って参加した人が報酬を獲得します',
      yourReferralCode: '紹介コード',
      joinAlphaBag: 'AlphaBag投資に参加',
      joinText: 'AlphaBag投資に参加して報酬を獲得しましょう！',
      youWereReferred: '紹介コードで招待されました',
      registrationTitle: '紹介コード登録',
      alphaBagTitle: 'Alpha BAG',
      registrationDescription: 'プロジェクトごとに紹介リンクを貼り付け、編集、保存します。保存した紹介リンクをコピーして紹介者に共有します。',
      copySelected: '選択をコピー',
      saveAll: 'すべて保存',
      resetAll: 'すべてリセット',
      saved: '保存済み',
      statusIdle: 'ステータス: アイドル',
      statusIdleDescription: '各プロジェクトの紹介リンクを入力して保存してください。',
      projectMaxFi: 'MaxFi',
      projectLoomX: 'LoomX',
      projectCodexField: 'CodexField',
      maxFiUrl: 'https://www.maxfi.io/?ref=...',
      loomXUrl: 'https://app.loom-x.com/?ref=...',
      codexFieldUrl: 'https://app.codexfield.co/?ref=...',
      enterReferralLink: '紹介リンクを入力',
      linkSaved: 'リンクが保存されました',
      linkCopied: 'リンクがコピーされました',
      linkDeleted: 'リンクが削除されました',
      allLinksSaved: 'すべてのリンクが保存されました',
      allLinksReset: 'すべてのリンクがリセットされました',
      selectProjects: 'コピーするプロジェクトを選択',
    },
    footer: {
      copyright: '© 2025 AlphaBag Investment. All rights reserved.',
    },
    common: {
      usdt: 'USDT',
    },
    investment: {
      title: '投資',
      investmentStatus: '投資ステータス',
      successPopup: '投資完了後に成功ポップアップを表示し、残り40%の手動投資の手順を提供します。',
      remaining40Manual: '残り40%の手動投資',
      remaining40Description: '現在BBBAGプロジェクトと統合中です。統合完了まで、以下のリンクからプロジェクトDAppにアクセスし、ウォレット内の残り40%の資金で手動投資を完了してください。',
      projectDAppUrl: 'プロジェクトDApp URL',
      copy: 'コピー',
      openDApp: 'DAppを開く',
      remaining40Funds: '残り40%資金（参考）',
      remaining40FundsDesc: 'ウォレット残高を確認してDAppで手動投資を完了してください',
      disclaimer: '* 統合完了後、このガイダンスは自動投資に変更される場合があります。',
      testSuccessPopup: '成功ポップアップをテスト',
      integrationStatus: '統合ステータス',
      currentStep: '現在のステップ',
      currentStepDesc: '40%の手動投資が必要',
      support: 'サポート',
      supportDesc: '問題が発生した場合は運営チームに連絡してください',
      integratingWithBBAG: 'BBBAGと統合中',
      notYetConnected: 'まだ接続されていません',
      urlCopied: 'DApp URLがコピーされました！',
      copyFailed: 'URLのコピーに失敗しました',
      invalidUrl: '有効なDApp URLを入力してください',
      investmentSuccessful: '投資成功！',
      investmentCompleted: '投資が正常に完了しました。',
      gotIt: '了解',
      dappUrlPlaceholder: 'https://YOUR-DAPP-LINK-HERE',
    },
    projectDetails: {
      title: 'プロジェクト詳細',
      description: 'プロジェクト説明',
      relatedMaterials: '関連資料',
      watchVideo: '動画を見る',
      telegram: 'Telegram',
      twitter: 'Twitter',
      close: '閉じる',
      quickActions: 'クイックアクション',
      resources: 'リソース',
      video: '動画',
      blog: 'ブログ',
      keyMetrics: '主要指標',
      detailInfo: '詳細情報',
      auditInfo: '監査情報',
      youtubeVideo: 'YouTube 動画',
      referenceMaterials: '参考資料',
    },
    projects: {
      viewDetails: '詳細を見る',
      goToDApp: 'このプロジェクトのDAppに直接アクセス',
      minInvestment: '最低投資額: $250',
      bbagb: 'B-BAGB',
      sbag: 'S-SBAG BAG',
      cbag: 'C-BAG',
      maxfi: 'MaxFi',
      numine: 'Numine',
      insurance: 'インシュアランス',
      maxfiProject: {
        focus: '安定 / 資産重視',
        description: 'Telegramから始まりオンチェーンで完結する非カストディアル取引ボット。日次利益0.6%-2%。元本はいつでも引き出し可能。',
        quickActionsDescription: '非カストディアル + オンチェーン決済と柔軟な元本引き出し。',
        tags: { binanceAlpha: 'Binance Alpha', nonCustodial: '非カストディアル', tradingBot: '取引ボット' },
      },
      roomx: {
        focus: '成長 / バランス型',
        description: 'クロスチェーン + 非カストディアル取引ボット。日次1.8%。利益確定後に元本返還。利益が5 USDTに達すると自動支払い。',
        quickActionsDescription: '自動支払いメカニズム付きクロスチェーン実行（5 USDTしきい値）。',
        tags: { binanceAlpha: 'Binance Alpha', crossChain: 'クロスチェーン', tradingBot: '取引ボット' },
      },
      codexfield: {
        focus: '戦略 / 構造化',
        description: 'CodexFieldはWeb3コンテンツ＆AIアセット取引プラットフォームのコアトークン。Binance Labsが支援。日次利回り1%。',
        quickActionsDescription: 'コンテンツ/AIアセットのナラティブ + Binance Labsの支援を強調。',
        tags: { binanceAlpha: 'Binance Alpha', web3: 'Web3', aiAssets: 'AIアセット' },
      },
    },
    profile: {
      title: 'プロフィール',
      connectWallet: 'ウォレットを接続',
      connectWalletDescription: 'プロフィールを表示するにはウォレットを接続してください',
      myNodes: 'マイノード',
      myNodesDescription: '購入したすべてのノードを表示',
      noNodesYet: 'まだノードを購入していません',
      myTotalInvestment: '総投資額',
      myTotalInvestmentDescription: 'プラットフォームへの総投資額',
      totalInvestedAmount: '総投資額',
      separateInvestmentContract: 'MAXFI投資',
      separateInvestmentContractDescription: 'MAXFI投資コントラクトへの投資',
      loadingInvestmentData: '投資データを読み込み中...',
      invested: '投資済み',
      investedInContract: 'このコントラクトに投資済み',
      investmentDetails: '投資詳細',
      investmentId: '投資ID:',
      amount: '金額:',
      token: 'トークン:',
      notInvestedInContract: 'まだこのコントラクトに投資していません',
      walletBalance: 'ウォレット残高',
      walletBalanceDescription: '現在のUSDT残高',
      availableForInvestment: '投資可能額',
      price: '価格:',
      nodeId: 'ノードID:',
      active: 'アクティブ',
      unknown: '不明',
      copiedToClipboard: 'クリップボードにコピーされました！',
      failedToCopy: 'コピーに失敗しました',
      recommender: '推薦者:',
      code: 'コード:',
      allocationBreakdown: '配分内訳',
      sbagPositions: 'SBAGポジション（NUMI）',
      sbagPositionsDescription: 'リアルタイムNUMI価格追跡付きSBAGポジション',
      noSBAGPositions: 'SBAGポジションが見つかりません',
      loadingSBAGPositions: 'SBAGポジションを読み込み中...',
      backofficeEntered: 'バックオフィス入力済み',
      investedUSDT: '投資USDT',
      holdingNUMI: '保有NUMI',
      avgPriceUSDT: '平均価格（USDT）',
      holdingUSDT: '保有USDT',
      currentPriceUSDT: '現在価格（USDT）',
      availableNUMI: '利用可能NUMI',
      unrealizedPL: '未実現損益',
      sellDelegation: '売却委任',
      pendingSells: '保留中の売却',
      sellAmount: '売却量（NUMI）',
      holdingAmount: '保有量',
      estimatedPL: '推定損益',
      slippageWarning: 'スリッページ警告',
      slippageWarningText: '市場流動性によって5%〜10%の売却スリッページが発生する場合があります。確認を押して売却委任を進めてください。',
      confirmSellDelegation: '売却委任を確認',
      positionNotConfirmed: 'バックオフィスによるポジション未確認',
      noNUMIAvailable: '売却可能なNUMIがありません',
      sellDelegationSubmitted: '売却委任が正常に送信されました',
      priceUpdated: '価格が更新されました',
      failedToFetchPrice: '価格の取得に失敗しました',
      failedToRefreshPrice: '価格の更新に失敗しました',
      alphaBag: 'Alpha BAG',
      projectAllocation: 'プロジェクト配分',
      sbagAllocation: 'SBAG配分',
      insuranceAllocation: 'インシュアランス配分',
      totalAllocation: '総配分',
      copy: 'コピー',
    },
    community: {
      title: 'コミュニティ',
      overallTeamPerformance: 'チーム全体のパフォーマンス',
      marketLevel: '市場レベル',
      teamNode: 'チームノード',
      personalPerformance: '個人パフォーマンス',
      regionalPerformance: '地域パフォーマンス',
      communityPerformance: 'コミュニティパフォーマンス',
      thirtySky: '30日',
      totalTeamPerformance: 'チーム総パフォーマンス',
      totalTeamMembers: 'チーム総メンバー数',
      myShare: '自分のシェア',
      numberOfDirectPush: '直接推薦数',
      totalNumberOfTeamMembers: 'チーム総メンバー数',
      noDirectReferrals: 'まだ直接紹介がありません',
    },
    notFound: {
      title: 'ページが見つかりません',
      description: '404',
      returnToHome: 'ホームに戻る',
    },
    agreement: {
      title: 'プラットフォーム参加・リスク確認同意書',
      subtitle: '続行する前に利用規約をお読みください',
      agreeLabel: '利用規約に同意します',
      agreeButton: '同意する',
      section1Title: '1. プラットフォームの目的',
      section1Content: 'このプラットフォームはプロジェクトのインキュベーションと市場開発をサポートするコミュニティベースのプラットフォームです。',
      section2Title: '2. プラットフォームの性質',
      section2Content: 'プラットフォームはコミュニティ主導のプロジェクト支援・協力プラットフォームとしてのみ運営されます。',
      section3Title: '3. 投資構造とリスク',
      section3Intro: '参加者は以下を認め同意します：',
      section3Point1: 'プラットフォームは比較的安定した資産成長を追求する方法として分散投資を推奨します。',
      section3Point2: '投資参加は元本の保全または返還を保証しません。',
      section3Point3: 'すべての投資には固有のリスクが伴います。',
      section4Title: '4. 保証または元本保護なし',
      section4Intro: '参加者は以下を理解し同意します：',
      section4Point1: 'プラットフォームはいかなる保証または元本保護も提供しません。',
      section4Point2: 'プラットフォームを通じて紹介されたプロジェクトへの参加は任意です。',
      section4Point3: 'プラットフォームは投資結果に対する保険を提供しません。',
      section5Title: '5. コミュニティ協力',
      section5Intro: '参加者は以下を理解し同意します：',
      section5Content: 'プラットフォームは協力コミュニティとして機能し、共有される情報は参考目的のみです。',
      section6Title: '6. 参加者の責任',
      section6Intro: '各参加者は以下に同意します：',
      section6Point1: 'すべての参加・投資決定は自己の判断と責任で行われます。',
      section6Point2: 'プロジェクトに参加する前に独自のデューデリジェンスを実施します。',
      section6Point3: 'プラットフォームは直接・間接的な損失に対して責任を負いません。',
      section7Title: '7. 免責事項',
      section7Intro: '適用法の最大限の範囲において：',
      section7Content: 'プラットフォームは参加、投資決定、またはプロジェクト結果から生じる損失、損害、または請求に対して責任を負いません。',
      section8Title: '8. 確認と同意',
      section8Intro: 'プラットフォームに参加することで、参加者は以下を確認します：',
      section8Point1: '上記のすべての条件を読み、理解し、同意しました。',
      section8Point2: '投資決定と参加は自己責任とリスク認識に基づいています。',
      section8Point3: 'プラットフォーム提供者へのすべての請求と投資保証を放棄します。',
    },
    introduction: {
      hero: {
        title: 'クリプトエコシステムの中心<br/><span>AlphaBagコミュニティプラットフォーム</span>',
        p1: 'AlphaBagは単一のプロトコルやプロジェクトではありません。取引所、メディア、プロジェクト、投資家、VCをつなぐコミュニティ主導の市場活性化プラットフォームです。',
        p2: 'すべての市場にはTier-1とTier-2のプレイヤーがいます。AlphaBagはすべての層をつなぐことができる中立で強力なハブです。',
      },
      why: {
        h: 'AlphaBagが作られた理由',
        p1: 'Web3では、多くの理由でプロジェクトが崩壊します。ビジョンや技術に関係なく、外部・内部の要因がいつでもプロジェクトを壊す可能性があります。',
        c1h: 'セキュリティ・技術リスク',
        c1p: 'ハック、コントラクトの脆弱性、意図的なロンダリングが一度の事件でプロジェクトを破壊することがあります。',
        c2h: '資金フローの問題',
        c2p: '流入が少なすぎるか、急激な大量流入がストラクチャーを不安定にさせ崩壊を引き起こします。',
        c3h: '悪意のある利益確定',
        c3p: '急速な利益確定、インサイダーのダンプ、短期設計が信頼を急速に破壊します。',
        p2: 'リーダーは努力しても本当の問題が見えないことがあります——プロジェクトが崩壊するまで。その後、<b>失われた信頼</b>と潜在的な<b>法的リスク</b>に直面します。',
        p3: 'AlphaBagはこれらの失敗を繰り返さないために構築されました：単一プロジェクトへの依存を減らし、<b>分散化と保護（保険的）構造</b>を通じてより安全に資金を運用し、<b>元本損失</b>を最小化します。',
      },
      life: {
        c1h: 'プロジェクトにはライフサイクルがある',
        c1p: 'いかなるプロジェクトも永続しない；成長と衰退は自然なフェーズです。',
        c2h: 'リーダーはすでに投資している',
        c2p: 'プラットフォームなしでも、リーダーは複数のプロジェクトを選択・運営しています。',
        c3h: '損失が管理されていないことが多い',
        c3p: '多くのモデルは上昇に焦点を当て、下落リスクを個人に任せています。',
      },
      core: {
        h: 'AlphaBagのコア方向性',
        p1: 'AlphaBagは利益より生存を優先し、分散化と保護構造によってリスクを管理します。',
        li1: 'すべての投資はリスクを前提とする',
        li2: '単一プロジェクトへの依存なし',
        li3: '利益と保護を並行して',
        li4: 'オンチェーンの透明性',
        li5: 'DAOとコミュニティ主導のガバナンス',
      },
      com: {
        h: 'コミュニティ原則と成長戦略',
        p1: 'AlphaBagはポートフォリオローテーションと極端な分散化に基づいて構築されており、100以上のプロジェクトを追跡・参加しながら長期的に組織を維持します。',
        li1: '<b>100以上のプロジェクト</b>：1つのプロジェクトへの依存を避け、幅広く追跡・参加。',
        li2: '<b>ローテーション</b>：条件の変化に応じてリスクを減らし機会を拡大するためにリバランス。',
        li3: '<b>長期組織</b>：プロジェクトが変わっても安定した運営を維持。',
        p2: 'コミュニティが成長するにつれ、集合的な実行で複数の収益とヘッジアプローチが可能になります。',
        li4: '<b>共同ミント/共同実行</b>：ミームコインセグメントを含む過小評価された機会を追求。',
        li5: '<b>ヘッジング</b>：共有利益を使ってボラティリティリスクを軽減。',
        li6: '<b>エアドロップ蓄積</b>：継続的な参加でトークン保有を拡大。',
        p3: 'スケールが拡大するにつれ、AlphaBagはすべての参加者と成長を共有するためのエコシステムトークン化を計画しています。',
      },
      pos: {
        h: 'AlphaBagの位置と役割',
        p1: 'クリプトは<b>取引所、メディア、プロジェクト、コミュニティ、VC</b>が異なるインセンティブで動く複雑なエコシステムです。AlphaBagはそれらをつなぐ<b>中央ハブ</b>を目指します。',
        c1h: '取引所',
        c1p: 'Tier-1取引所は競争とスケールの違いから、ネットワーク組織や小規模取引所との表面的なパートナーシップを避けることが多い。',
        c2h: 'メディアとVC',
        c2p: 'トップメディアとVCは信頼できる仲介者が必要；未検証のコミュニティと直接協力することは稀。',
        c3h: 'コミュニティとプロジェクト',
        c3p: 'プロジェクトには流動性、取引量、参加者が必要だが、持続可能な活性化構造が欠けていることが多い。',
        p2: 'AlphaBagはトップ取引所、トップメディア、トップ投資家と協力できます。なぜなら市場を動かすもの——<b>リーダー、組織、コミュニティ</b>——も持っているからです。',
        p3: 'AlphaBagは流動性が枯渇したときに市場を再活性化し、初期段階のトラクションを加速し、衰退しているプロジェクトを再活性化することを目指します。',
        p4: 'Tier-1からインキュベーティングプロジェクトまで、AlphaBagは幅広い協力が可能なベストクロスポイントを目指します。',
        mapH: 'AlphaBagエコシステムマップ',
        mapP: '（テキストベースのハブレイアウト）',
        mapPre: '        [ トップ取引所 ]\n  Binance / Coinbase / Upbit\n              │\n[ トップメディア & VC ] ── AlphaBag ── [ コミュニティ & リーダー ]\n              │\n     [ プロジェクト & インキュベーション ]',
      },
      g: {
        h: 'グローバル展開と中長期ビジョン',
        p1: 'AlphaBagは<b>20以上の国</b>にわたるリーダーとともに国レベルの分散型コミュニティを構築し、<b>共同構築者</b>のエコシステムを形成しています。',
        li1: '<b>2026年目標</b>：各国1,000以上のコアリーダー',
        li2: '<b>アクティブユーザー</b>：100,000以上のアクティブユーザーで拡大',
        li3: '<b>中期規模</b>：2,000,000以上のグローバル参加者',
        p2: 'AlphaBagはファウンデーションとパートナーとの連携で、Binance Alpha候補や長期高品質資産を含むパイプラインプロジェクトを審査しています。',
        li4: '長期資産：<b>ETH、BNB、OKB、SOL</b>',
        li5: '長期DeFi：長期持続するように設計された構造',
        li6: '新しいAlpha：構造的に強い初期段階のプロジェクト',
        p3: 'ほとんどの投資は大きな勝者にはなりません——しかし1つか2つ成功すれば、ポートフォリオは指数的に成長できます。',
        p4: 'AlphaBagは長期性、保護、分散化を通じて確率を改善することに注力します。',
      },
      bag: {
        h: 'AlphaBag BAGシステム',
        p1: 'AlphaBagはリスク選好と市場環境に適応するマルチレイヤー資産運用フレームワークとして設計されています。',
        abag: 'ABAGはコアセーフティレイヤーで、最も持続可能な長期DeFi設計に基づいています。',
        bbag: 'BBAGは<b>固定ステーキング</b>と<b>チーム/ネットワーク収益</b>に焦点を当てたメインゾーンです。',
        cbag: 'CBAGは保護準備金/流動性資産として約<b>20%</b>を配分します。',
        sbag: 'SBAGは<b>元本と利益のリアルタイム引き出し</b>をサポートする特別プロジェクトゾーンです。',
        p2: 'BAGは短期的な話題性よりもリスク管理、耐久性、元本保護を優先します。',
      },
      lead: {
        h: 'リーダー中心の構造',
        p1: 'リーダーはリーダーであり続けたい；投資家はリーダーの選択を信頼し長期的に一緒にいたい。',
        p2: '実際には、プロジェクトが失敗したり、より良い機会が現れたりする——そのため幅広い分散化が実践的な選択です。',
        c1h: '単一プロジェクト集中のリスク',
        c1p: '集中は大きな上昇をもたらすこともある——しかしプロジェクトが崩壊すると大きな下落も。',
        c2h: '異なる投資家の好み',
        c2p: '投資家はさまざま：保守的、積極的、その間——1つのプロジェクトではすべてを満足させられない。',
        c3h: '信頼できる仲介者の必要性',
        c3p: '投資家は迅速な情報、分散化オプション、検証済みの創設者/技術が必要——信頼できるプラットフォームを通じて。',
        p3: 'AlphaBagはメディア、VC、取引所、インフルエンサー、法律、財務にわたるエキスパートノードを持つプロフェッショナルな検証レイヤーの構築を目指します。',
        p4: 'リーダーのためにAlphaBagは組織の脚を保持し、チームを再構築せずにプロジェクトを横にシフトできるようにサポートします。',
        p5: '核心は：組織の継続性と信頼ベースの長期運営。',
      },
      inv: {
        h: '投資の現実とAlphaBagの哲学',
        p1: 'いかなる投資も100%の利益を保証できません。多くのWeb3モデルは投資家に価値を返すのではなく、投資家から価値を奪います。',
        p2: '市場は自由取引環境です；高値で入って動けなくなることはよくあります。',
        p3: 'リターンはしばしば安値での購入、高値での利確、多様なオプションの活用から生まれます。',
        p4: 'AlphaBagは安定した複利を目指します：安値に素早く入り、成長し、新しい安値ゾーンに再入して複利を継続します。',
        p5: '同時に、高リスク/高リターン領域（例：ミームコイン）に小部分を配分して、時折大きな利益を獲得することができます。',
        p6: 'AlphaBagの目的は、リーダーと投資家の間の努力して築いた信頼を、世代を超えて続くプラットフォームベースの耐久性のある分散型コミュニティに変えることです。',
      },
      fin: {
        h: '最後のメッセージ',
        p1: '躊躇しているリーダーやメンバーの皆さん、市場は最終的にAlphaBagのようなコミュニティ投資プラットフォームに移行するでしょう。',
        p2: '重要なのは参加するかどうかではなく、<b>どれだけ早く</b>参加するかです。早い参加者ほど強いネットワークを構築し、複利成長の波に乗ることができます。',
        p3: 'AlphaBagは短期的なトレンドではありません。リーダーとコミュニティが一緒に成長する長期的な構造を目指します。',
      },
      foot: '© AlphaBagコミュニティプラットフォーム. All rights reserved.',
    },
  },
};

