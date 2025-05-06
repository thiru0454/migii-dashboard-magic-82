
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { 
  Users, 
  MapPin,
  MessageSquare,
  BarChart2,
  Languages,
  Search,
  Award,
  Download,
  Calendar,
  NewsP,
  HelpCircle,
  CheckCircle,
  Star
} from "lucide-react";
import { T } from "@/components/T";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";
import { useLanguage } from "@/contexts/LanguageContext";

// Mock data for the dashboard
const fetchDashboardData = async () => {
  // In a real app, this would be an API call
  return {
    workers: {
      total: 12587,
      active: 10234,
      registered: 342
    },
    jobs: {
      posted: 845,
      filled: 623,
      pending: 222
    },
    regions: {
      covered: 28,
      topRegions: ['Maharashtra', 'Gujarat', 'Karnataka', 'Tamil Nadu', 'Delhi']
    },
    languages: {
      supported: 12,
      list: ['Hindi', 'Tamil', 'Bengali', 'Telugu', 'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Odia', 'Punjabi', 'Urdu', 'English']
    },
    grievances: {
      resolved: 327,
      pending: 45
    },
    successStories: [
      {
        id: 1,
        name: "Rajesh Kumar",
        description: "Found a construction job within 3 days of registration",
        image: "https://images.unsplash.com/photo-1483381719261-6620dfa2d3ba?q=80&w=300&h=300&auto=format&fit=crop"
      },
      {
        id: 2,
        name: "Priya Shah",
        description: "Connected with an employer who provided free accommodation",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&h=300&auto=format&fit=crop"
      },
      {
        id: 3,
        name: "Mohammed Ali",
        description: "Resolved payment dispute through Migii's intervention",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&h=300&auto=format&fit=crop"
      }
    ],
    news: [
      {
        id: 1,
        title: "New Worker Safety Guidelines Released",
        date: "May 2, 2025"
      },
      {
        id: 2,
        title: "E-Shram Registration Drive in Rural Areas",
        date: "April 28, 2025"
      },
      {
        id: 3,
        title: "Government Extends Healthcare Benefits for Migrant Workers",
        date: "April 21, 2025"
      },
      {
        id: 4,
        title: "Upcoming Job Fair in Delhi Region - May 15",
        date: "April 18, 2025"
      }
    ],
    faq: [
      {
        id: 1,
        question: "How do I register as a worker?",
        answer: "Visit the 'Register as a Worker' section on our website or download our mobile app. You'll need to provide basic personal information, work experience, and skill details."
      },
      {
        id: 2,
        question: "How can employers verify worker identities?",
        answer: "Use the 'Verify Worker' feature and enter the worker's Migii ID or scan their QR code for instant verification of identity and skills."
      },
      {
        id: 3,
        question: "What support does Migii offer for grievances?",
        answer: "We provide a 24/7 helpline, in-app chat support, and a formal grievance filing system that ensures resolution within 48 hours for urgent matters."
      }
    ]
  };
};

const Index = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data, isLoading } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: fetchDashboardData
  });

  const handleRoleSelection = (role: string) => {
    switch (role) {
      case "worker":
        navigate("/worker-login");
        break;
      case "business":
        navigate("/login?tab=business");
        break;
      case "admin":
        navigate("/login?tab=admin");
        break;
    }
  };

  if (isLoading || !data) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="loader"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-10">
        {/* 1. Hero Banner */}
        <section className="relative rounded-lg overflow-hidden bg-gradient-to-r from-indigo-600 to-primary h-80 mb-8">
          <div className="absolute inset-0 bg-black/20 z-10"></div>
          <div className="relative z-20 h-full flex flex-col justify-center items-center text-center px-4 md:px-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              <T keyName="heroBannerTitle" />
            </h1>
            <p className="text-white/90 text-lg md:text-xl max-w-2xl mb-6">
              <T keyName="heroBannerSubtitle" />
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" className="font-medium">
                <T keyName="joinNow" />
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur text-white border-white/20 hover:bg-white/20">
                <T keyName="postJob" />
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur text-white border-white/20 hover:bg-white/20">
                <T keyName="trackStatus" />
              </Button>
            </div>
          </div>
        </section>

        {/* 2. Quick Access Role Selector */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4"><T keyName="selectYourRole" /></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card onClick={() => handleRoleSelection("worker")} className="cursor-pointer hover:shadow-md transition-all hover:border-primary">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2"><T keyName="worker" /></h3>
                <p className="text-sm text-muted-foreground"><T keyName="workerDescription" /></p>
              </CardContent>
            </Card>
            
            <Card onClick={() => handleRoleSelection("business")} className="cursor-pointer hover:shadow-md transition-all hover:border-primary">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2"><T keyName="employer" /></h3>
                <p className="text-sm text-muted-foreground"><T keyName="employerDescription" /></p>
              </CardContent>
            </Card>
            
            <Card onClick={() => handleRoleSelection("admin")} className="cursor-pointer hover:shadow-md transition-all hover:border-primary">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                  <BarChart2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2"><T keyName="admin" /></h3>
                <p className="text-sm text-muted-foreground"><T keyName="adminDescription" /></p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 3. Live Dashboard Counters */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4"><T keyName="liveStatistics" /></h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="hover-glow hover-scale">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <Users className="h-5 w-5 text-primary mb-1" />
                <p className="text-sm text-muted-foreground"><T keyName="registeredWorkers" /></p>
                <p className="text-xl font-bold">{data.workers.total.toLocaleString()}</p>
              </CardContent>
            </Card>
            
            <Card className="hover-glow hover-scale">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <Calendar className="h-5 w-5 text-primary mb-1" />
                <p className="text-sm text-muted-foreground"><T keyName="jobsPosted" /></p>
                <p className="text-xl font-bold">{data.jobs.posted.toLocaleString()}</p>
              </CardContent>
            </Card>
            
            <Card className="hover-glow hover-scale">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <CheckCircle className="h-5 w-5 text-primary mb-1" />
                <p className="text-sm text-muted-foreground"><T keyName="jobsFilled" /></p>
                <p className="text-xl font-bold">{data.jobs.filled.toLocaleString()}</p>
              </CardContent>
            </Card>
            
            <Card className="hover-glow hover-scale">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <MapPin className="h-5 w-5 text-primary mb-1" />
                <p className="text-sm text-muted-foreground"><T keyName="regionsCovered" /></p>
                <p className="text-xl font-bold">{data.regions.covered}</p>
              </CardContent>
            </Card>
            
            <Card className="hover-glow hover-scale">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <Languages className="h-5 w-5 text-primary mb-1" />
                <p className="text-sm text-muted-foreground"><T keyName="languagesSupported" /></p>
                <p className="text-xl font-bold">{data.languages.supported}</p>
              </CardContent>
            </Card>
            
            <Card className="hover-glow hover-scale">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <MessageSquare className="h-5 w-5 text-primary mb-1" />
                <p className="text-sm text-muted-foreground"><T keyName="grievancesResolved" /></p>
                <p className="text-xl font-bold">{data.grievances.resolved.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 4. Smart Search Panel */}
        <section className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle><T keyName="searchTitle" /></CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input 
                    placeholder={t("searchPlaceholder")} 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Tabs defaultValue="jobs" className="w-full md:w-auto">
                  <TabsList>
                    <TabsTrigger value="jobs"><T keyName="jobs" /></TabsTrigger>
                    <TabsTrigger value="workers"><T keyName="workers" /></TabsTrigger>
                    <TabsTrigger value="status"><T keyName="status" /></TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button><T keyName="search" /></Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <Button variant="outline" size="sm"><T keyName="filterLanguage" /></Button>
                <Button variant="outline" size="sm"><T keyName="filterSkills" /></Button>
                <Button variant="outline" size="sm"><T keyName="filterLocation" /></Button>
                <Button variant="outline" size="sm"><T keyName="filterExperience" /></Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 5. Highlighted Features */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4"><T keyName="keyFeatures" /></h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { icon: CheckCircle, title: "featureDigitalID", desc: "featureDigitalIDDesc" },
              { icon: MapPin, title: "featureTracking", desc: "featureTrackingDesc" },
              { icon: Languages, title: "featureMultilingual", desc: "featureMultilingualDesc" },
              { icon: Award, title: "featureMobile", desc: "featureMobileDesc" },
              { icon: HelpCircle, title: "featureGrievance", desc: "featureGrievanceDesc" }
            ].map((feature, idx) => (
              <Card key={idx} className="hover:shadow-md transition-all cursor-pointer hover:border-primary">
                <CardContent className="p-4 flex flex-col items-center text-center pt-6">
                  <div className="bg-primary/10 p-3 rounded-full mb-3">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-base mb-2"><T keyName={feature.title} /></h3>
                  <p className="text-xs text-muted-foreground"><T keyName={feature.desc} /></p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* 6. Migrant Services */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4"><T keyName="migrantServices" /></h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center p-4 bg-card rounded-lg border hover:shadow-md transition-all cursor-pointer hover:border-primary">
              <div className="mr-4 bg-primary/10 p-3 rounded-full">
                <Search className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold"><T keyName="serviceFindJobs" /></h3>
                <p className="text-sm text-muted-foreground"><T keyName="serviceFindJobsDesc" /></p>
              </div>
            </div>
            
            <div className="flex items-center p-4 bg-card rounded-lg border hover:shadow-md transition-all cursor-pointer hover:border-primary">
              <div className="mr-4 bg-primary/10 p-3 rounded-full">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold"><T keyName="serviceRegister" /></h3>
                <p className="text-sm text-muted-foreground"><T keyName="serviceRegisterDesc" /></p>
              </div>
            </div>
            
            <div className="flex items-center p-4 bg-card rounded-lg border hover:shadow-md transition-all cursor-pointer hover:border-primary">
              <div className="mr-4 bg-primary/10 p-3 rounded-full">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold"><T keyName="serviceVerify" /></h3>
                <p className="text-sm text-muted-foreground"><T keyName="serviceVerifyDesc" /></p>
              </div>
            </div>
            
            <div className="flex items-center p-4 bg-card rounded-lg border hover:shadow-md transition-all cursor-pointer hover:border-primary">
              <div className="mr-4 bg-primary/10 p-3 rounded-full">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold"><T keyName="serviceLocate" /></h3>
                <p className="text-sm text-muted-foreground"><T keyName="serviceLocateDesc" /></p>
              </div>
            </div>
            
            <div className="flex items-center p-4 bg-card rounded-lg border hover:shadow-md transition-all cursor-pointer hover:border-primary">
              <div className="mr-4 bg-primary/10 p-3 rounded-full">
                <HelpCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold"><T keyName="serviceRights" /></h3>
                <p className="text-sm text-muted-foreground"><T keyName="serviceRightsDesc" /></p>
              </div>
            </div>
            
            <div className="flex items-center p-4 bg-card rounded-lg border hover:shadow-md transition-all cursor-pointer hover:border-primary">
              <div className="mr-4 bg-primary/10 p-3 rounded-full">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold"><T keyName="serviceSupport" /></h3>
                <p className="text-sm text-muted-foreground"><T keyName="serviceSupportDesc" /></p>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Success Stories & 8. News Feed - Combined in tabs */}
        <section className="mb-8">
          <Tabs defaultValue="stories">
            <TabsList className="mb-4">
              <TabsTrigger value="stories"><T keyName="successStories" /></TabsTrigger>
              <TabsTrigger value="news"><T keyName="newsUpdates" /></TabsTrigger>
            </TabsList>
            
            <TabsContent value="stories">
              <Carousel className="w-full">
                <CarouselContent>
                  {data.successStories.map((story) => (
                    <CarouselItem key={story.id} className="md:basis-1/2 lg:basis-1/3">
                      <Card className="h-full">
                        <CardContent className="p-4 flex flex-col h-full">
                          <div className="flex items-center mb-4">
                            <img src={story.image} alt={story.name} className="w-12 h-12 object-cover rounded-full mr-4" />
                            <div>
                              <h4 className="font-semibold">{story.name}</h4>
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                ))}
                              </div>
                            </div>
                          </div>
                          <p className="text-sm flex-1">{story.description}</p>
                          <Button variant="link" className="mt-2 p-0 h-auto justify-start">
                            <T keyName="readMore" />
                          </Button>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="flex justify-end mt-4 gap-2">
                  <CarouselPrevious className="position-static" />
                  <CarouselNext className="position-static" />
                </div>
              </Carousel>
            </TabsContent>
            
            <TabsContent value="news">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {data.news.map((item) => (
                      <div key={item.id} className="flex items-start border-b pb-4 last:border-0 last:pb-0">
                        <div className="mr-4 bg-primary/10 p-2 rounded-full mt-1">
                          <HelpCircle className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-xs text-muted-foreground">{item.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>
        
        {/* 9. Mobile App Promotion */}
        <section className="mb-8">
          <Card className="bg-gradient-to-r from-indigo-600 to-primary text-white overflow-hidden">
            <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between">
              <div className="mb-6 md:mb-0 md:mr-6">
                <h3 className="text-xl font-bold mb-2"><T keyName="appPromoTitle" /></h3>
                <p className="text-white/80 mb-4"><T keyName="appPromoDesc" /></p>
                <div className="flex gap-4">
                  <Button variant="outline" className="bg-white text-primary hover:bg-white/90">
                    <Download className="mr-2 h-4 w-4" />
                    <T keyName="androidApp" />
                  </Button>
                  <Button variant="outline" className="bg-white text-primary hover:bg-white/90">
                    <Download className="mr-2 h-4 w-4" />
                    <T keyName="iOSApp" />
                  </Button>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-lg p-4 flex flex-col items-center">
                <div className="mb-2 text-sm font-medium"><T keyName="scanQRCode" /></div>
                <div className="bg-white p-2 rounded">
                  {/* Mock QR Code - In real app use a QR code library */}
                  <div className="w-24 h-24 bg-black/90 grid grid-cols-3 grid-rows-3 gap-1 p-1">
                    <div className="bg-white"></div>
                    <div></div>
                    <div className="bg-white"></div>
                    <div></div>
                    <div className="bg-white"></div>
                    <div></div>
                    <div className="bg-white"></div>
                    <div className="bg-white"></div>
                    <div className="bg-white"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
        
        {/* 10. Help & Support Center */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4"><T keyName="helpSupport" /></h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle><T keyName="frequentlyAsked" /></CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.faq.map((item) => (
                    <div key={item.id} className="space-y-2">
                      <h4 className="font-medium">{item.question}</h4>
                      <p className="text-sm text-muted-foreground">{item.answer}</p>
                    </div>
                  ))}
                  <Button variant="link" className="p-0">
                    <T keyName="viewAllFAQs" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle><T keyName="contactUs" /></CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <HelpCircle className="h-4 w-4 mr-2 text-primary" />
                    <span><T keyName="emergencyHelpline" />: 1800-XXX-XXXX</span>
                  </div>
                  <div className="space-y-2">
                    <Input placeholder={t("yourName")} />
                    <Input placeholder={t("yourEmail")} />
                    <Input placeholder={t("yourQuery")} />
                    <Button className="w-full"><T keyName="submit" /></Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    <T keyName="responseTime" />
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        
        {/* 11. Footer */}
        <section>
          <div className="border-t pt-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div>
                <h3 className="font-semibold mb-3"><T keyName="aboutUs" /></h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-muted-foreground hover:text-foreground"><T keyName="ourMission" /></a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-foreground"><T keyName="howItWorks" /></a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-foreground"><T keyName="team" /></a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3"><T keyName="partners" /></h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-muted-foreground hover:text-foreground"><T keyName="governmentAgencies" /></a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-foreground"><T keyName="NGOs" /></a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-foreground"><T keyName="corporates" /></a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3"><T keyName="resources" /></h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-muted-foreground hover:text-foreground"><T keyName="blog" /></a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-foreground"><T keyName="pressReleases" /></a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-foreground"><T keyName="reports" /></a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3"><T keyName="legal" /></h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-muted-foreground hover:text-foreground"><T keyName="privacyPolicy" /></a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-foreground"><T keyName="termsOfUse" /></a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-foreground"><T keyName="disclaimer" /></a></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t pt-6 pb-8 flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-muted-foreground mb-4 md:mb-0">
                &copy; 2025 Migii. <T keyName="allRightsReserved" />
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-muted-foreground hover:text-foreground">
                  <span className="sr-only">Facebook</span>
                  Facebook
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground">
                  <span className="sr-only">Twitter</span>
                  Twitter
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground">
                  <span className="sr-only">Instagram</span>
                  Instagram
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default Index;
