import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal, FlatList, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DB, AUTH } from '../firebaseConfig';
import { doc, setDoc, collection, updateDoc, getDoc, query, where, getDocs, arrayUnion, arrayRemove } from 'firebase/firestore';
import { nanoid } from 'nanoid/non-secure';
import { sharedStyles } from '../styles/sharedStyles';
import { usePremium } from '../contexts/PremiumContext';
import { PremiumGuard } from '../utils/premiumGuard';


const generateInviteCode = () => {
    return 'FMLY-' + nanoid(6).toUpperCase();
};

const FamilyGroupScreen = ({ navigation }) => {
    const { isPremium, isLoadingPremium } = usePremium();

    const [currentGroup, setCurrentGroup] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [isJoinModalVisible, setIsJoinModalVisible] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [members, setMembers] = useState([]);
    const [inviteEmail, setInviteEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const [userRole, setUserRole] = useState('Member');

    useEffect(() => {
        fetchCurrentGroup();
    }, []);

    const fetchCurrentGroup = async () => {
        if (!AUTH.currentUser) return;
        
        try {
            const userDoc = await getDoc(doc(DB, "users", AUTH.currentUser.uid));
            if (userDoc.exists() && userDoc.data().currentGroupId) {
                const groupDoc = await getDoc(doc(DB, "families", userDoc.data().currentGroupId));
                if (groupDoc.exists()) {
                    const groupData = { id: groupDoc.id, ...groupDoc.data() };
                    setCurrentGroup(groupData);
                    
                    const currentMember = groupData.members?.find(m => m.uid === AUTH.currentUser.uid);
                    setUserRole(currentMember?.role || 'Member');
                    
                    await fetchMembersDetails(groupData.members || []);
                }
            }
        } catch (error) {
            console.error("Error fetching group: ", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    const fetchMembersDetails = async (membersList) => {
        if (!membersList || membersList.length === 0) {
            setMembers([]);
            return;
        }
        
        try {
            const memberDetails = [];
            for (const member of membersList) {
                const userDoc = await getDoc(doc(DB, "users", member.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    memberDetails.push({
                        uid: member.uid,
                        role: member.role,
                        email: userData.email,
                        displayName: userData.displayName || userData.email.split('@')[0],
                        joinedAt: member.joinedAt
                    });
                }
            }
            setMembers(memberDetails);
        } catch (error) {
            console.error("Error fetching member details:", error);
        }
    };

    const createNewFamilyGroup = async () => {
        if (!groupName.trim()) {
            Alert.alert("Анхааруулга", "Группийн нэрийг оруулна уу.");
            return;
        }

        const user = AUTH.currentUser;
        if (!user) return;

        setIsCreating(true);
        try {
            const newGroupRef = doc(collection(DB, "families"));
            const newGroupId = newGroupRef.id;
            
            const groupData = {
                name: groupName.trim(),
                adminUid: user.uid,
                inviteCode: generateInviteCode(),
                createdAt: new Date(),
                members: [{
                    uid: user.uid,
                    role: 'Admin',
                    joinedAt: new Date(),
                }],
            };
            
            await setDoc(newGroupRef, groupData);

            const userRef = doc(DB, "users", user.uid);
            await updateDoc(userRef, {
                currentGroupId: newGroupId,
                currentRole: 'Admin',
            });

            setCurrentGroup({ id: newGroupId, ...groupData });
            setUserRole('Admin');
            setIsCreateModalVisible(false);
            setGroupName('');
            setSuccessMessage(`Гэр бүлийн групп "${groupName}" амжилттай үүслээ.`);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 1500);
            
            await fetchMembersDetails(groupData.members);

        } catch (error) {
            console.error("Error creating family group: ", error);
            Alert.alert("Алдаа", "Групп үүсгэхэд алдаа гарлаа.");
        } finally {
            setIsCreating(false);
        }
    };

    const joinFamilyGroup = async () => {
        if (!inviteCode.trim()) {
            Alert.alert("Анхааруулга", "Урилгын кодыг оруулна уу.");
            return;
        }

        const user = AUTH.currentUser;
        if (!user) return;

        setIsJoining(true);
        try {
            const q = query(collection(DB, "families"), where("inviteCode", "==", inviteCode.trim()));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                Alert.alert("Алдаа", "Урилгын код олдсонгүй.");
                return;
            }

            const groupDoc = querySnapshot.docs[0];
            const groupData = groupDoc.data();
            
            if (groupData.members.some(member => member.uid === user.uid)) {
                Alert.alert("Анхааруулга", "Та аль хэдийн энэ группт байна.");
                return;
            }

            const updatedMembers = [...groupData.members, {
                uid: user.uid,
                role: 'Member',
                joinedAt: new Date(),
            }];

            await updateDoc(doc(DB, "families", groupDoc.id), {
                members: updatedMembers
            });

            const userRef = doc(DB, "users", user.uid);
            await updateDoc(userRef, {
                currentGroupId: groupDoc.id,
                currentRole: 'Member',
            });

            setCurrentGroup({ id: groupDoc.id, ...groupData, members: updatedMembers });
            setUserRole('Member');
            setIsJoinModalVisible(false);
            setInviteCode('');
            setSuccessMessage(`"${groupData.name}" группт амжилттай нэгдлээ.`);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 1500);
            
            await fetchMembersDetails(updatedMembers);

        } catch (error) {
            console.error("Error joining family group: ", error);
            Alert.alert("Алдаа", "Группт нэгдэхэд алдаа гарлаа.");
        } finally {
            setIsJoining(false);
        }
    };
    
    const inviteMemberByEmail = async () => {
        if (!inviteEmail.trim()) {
            Alert.alert("Анхааруулга", "Имэйл хаягаа оруулна уу.");
            return;
        }
        
        if (userRole !== 'Admin') {
            Alert.alert("Алдаа", "Зөвхөн админ гишүүн урьж чадна.");
            return;
        }
        
        setIsInviting(true);
        try {
            const q = query(collection(DB, "users"), where("email", "==", inviteEmail.trim().toLowerCase()));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                Alert.alert("Алдаа", `"${inviteEmail}" имэйлтэй хэрэглэгч олдсонгүй.`);
                return;
            }
            
            const userDoc = querySnapshot.docs[0];
            const invitedUid = userDoc.id;
            
            if (members.some(m => m.uid === invitedUid)) {
                Alert.alert("Анхааруулга", "Энэ хэрэглэгч аль хэдийн группт байна.");
                return;
            }
            
            const newMember = {
                uid: invitedUid,
                role: 'Member',
                joinedAt: new Date()
            };
            
            await updateDoc(doc(DB, "families", currentGroup.id), {
                members: arrayUnion(newMember)
            });
            
            await updateDoc(doc(DB, "users", invitedUid), {
                currentGroupId: currentGroup.id,
                currentRole: 'Member'
            });
            
            setInviteEmail('');
            setSuccessMessage(`${inviteEmail} гишүүнийг амжилттай урилаа.`);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 1500);
            
            fetchCurrentGroup();
            
        } catch (error) {
            console.error("Error inviting member:", error);
            Alert.alert("Алдаа", "Гишүүн урьхад алдаа гарлаа.");
        } finally {
            setIsInviting(false);
        }
    };
    
    const changeUserRole = async (memberUid, currentRole) => {
        if (userRole !== 'Admin') {
            Alert.alert("Алдаа", "Зөвхөн админ эрх солж чадна.");
            return;
        }
        
        if (memberUid === AUTH.currentUser.uid) {
            Alert.alert("Алдаа", "Өөрийн эрхийг солж чадахгүй.");
            return;
        }
        
        const newRole = currentRole === 'Admin' ? 'Member' : 'Admin';
        const memberName = members.find(m => m.uid === memberUid)?.displayName;
        
        Alert.alert(
            "Эрх Солих",
            `${memberName}-ийн эрхийг "${newRole}" болгох уу?`,
            [
                { text: "Буцах", style: "cancel" },
                { text: "Солих", onPress: async () => {
                    try {
                        const oldMember = currentGroup.members.find(m => m.uid === memberUid);
                        const newMember = { ...oldMember, role: newRole };
                        
                        await updateDoc(doc(DB, "families", currentGroup.id), {
                            members: arrayRemove(oldMember)
                        });
                        
                        await updateDoc(doc(DB, "families", currentGroup.id), {
                            members: arrayUnion(newMember)
                        });
                        
                        await updateDoc(doc(DB, "users", memberUid), {
                            currentRole: newRole
                        });
                        
                        setSuccessMessage(`${memberName}-ийн эрх ${newRole} боллоо.`);
                        setShowSuccess(true);
                        setTimeout(() => setShowSuccess(false), 1500);
                        
                        fetchCurrentGroup();
                        
                    } catch (error) {
                        console.error("Error changing role:", error);
                        Alert.alert("Алдаа", "Эрх солиход алдаа гарлаа.");
                    }
                }}
            ]
        );
    };
    
    const removeMember = async (memberUid) => {
        if (userRole !== 'Admin') {
            Alert.alert("Алдаа", "Зөвхөн админ гишүүн хасаж чадна.");
            return;
        }
        
        if (memberUid === AUTH.currentUser.uid) {
            Alert.alert("Алдаа", "Өөрийгөө хасаж чадахгүй.");
            return;
        }
        
        const memberName = members.find(m => m.uid === memberUid)?.displayName;
        
        Alert.alert(
            "Гишүүн Хасах",
            `${memberName}-ийг группоос хасах уу?`,
            [
                { text: "Буцах", style: "cancel" },
                { text: "Хасах", style: "destructive", onPress: async () => {
                    try {
                        const memberToRemove = currentGroup.members.find(m => m.uid === memberUid);
                        
                        await updateDoc(doc(DB, "families", currentGroup.id), {
                            members: arrayRemove(memberToRemove)
                        });
                        
                        await updateDoc(doc(DB, "users", memberUid), {
                            currentGroupId: null,
                            currentRole: null
                        });
                        
                        setSuccessMessage(`${memberName}-ийг группоос хаслаа.`);
                        setShowSuccess(true);
                        setTimeout(() => setShowSuccess(false), 1500);
                        
                        fetchCurrentGroup();
                        
                    } catch (error) {
                        console.error("Error removing member:", error);
                        Alert.alert("Алдаа", "Гишүүн хасахад алдаа гарлаа.");
                    }
                }}
            ]
        );
    };
    
    const renderMemberItem = ({ item }) => {
        const isCurrentUser = item.uid === AUTH.currentUser.uid;
        const isAdmin = userRole === 'Admin';
        
        return (
            <View style={styles.memberCard}>
                <View style={styles.memberInfo}>
                    <Ionicons 
                        name={item.role === 'Admin' ? 'shield-checkmark' : 'person-circle-outline'} 
                        size={30} 
                        color={item.role === 'Admin' ? '#28a745' : '#007bff'} 
                    />
                    <View style={styles.memberDetails}>
                        <Text style={styles.memberName}>
                            {item.displayName} {isCurrentUser && '(Та)'}
                        </Text>
                        <Text style={styles.memberEmail}>{item.email}</Text>
                        <Text style={styles.memberRole}>{item.role}</Text>
                    </View>
                </View>
                
                {isAdmin && !isCurrentUser && (
                    <View style={styles.memberActions}>
                        <TouchableOpacity 
                            style={[styles.actionBtn, styles.roleBtn]}
                            onPress={() => changeUserRole(item.uid, item.role)}
                        >
                            <Text style={styles.actionBtnText}>
                                {item.role === 'Admin' ? 'Member' : 'Admin'}
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[styles.actionBtn, styles.removeBtn]}
                            onPress={() => removeMember(item.uid)}
                        >
                            <Ionicons name="trash-outline" size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    if (isLoadingPremium) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.subText }]}>Тохиргоог шалгаж байна...</Text>
            </View>
        );
    }
    
    if (!isPremium) {
        return <PremiumGuard navigation={navigation} featureName="Гэр Бүлийн Санхүү" />;
    }

    if (isLoading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.subText }]}>Группийн мэдээллийг татаж байна...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.headerTitle}>Гэр Бүлийн Санхүү</Text>
            
            {currentGroup ? (
                <View style={styles.groupCard}>
                    <View style={styles.groupHeader}>
                        <Ionicons name="people-outline" size={30} color="#007bff" />
                        <Text style={styles.groupName}>{currentGroup.name}</Text>
                    </View>
                    
                    <View style={styles.groupInfo}>
                        <Text style={styles.inviteCodeLabel}>Урилгын код:</Text>
                        <Text style={styles.inviteCodeText}>{currentGroup.inviteCode}</Text>
                    </View>
                    
                    <View style={styles.roleInfo}>
                        <Text style={styles.roleLabel}>Таны эрх:</Text>
                        <Text style={[styles.roleText, userRole === 'Admin' && styles.adminRole]}>
                            {userRole}
                        </Text>
                    </View>
                    
                    {userRole === 'Admin' && (
                        <View style={styles.inviteSection}>
                            <Text style={styles.sectionTitle}>Гишүүн урих (Имэйлээр)</Text>
                            <View style={styles.inviteRow}>
                                <TextInput
                                    style={styles.inviteInput}
                                    placeholder="Имэйл хаяг"
                                    value={inviteEmail}
                                    onChangeText={setInviteEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    editable={!isInviting}
                                />
                                <TouchableOpacity 
                                    style={styles.inviteBtn}
                                    onPress={inviteMemberByEmail}
                                    disabled={isInviting || !inviteEmail.trim()}
                                >
                                    {isInviting ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <Ionicons name="send" size={20} color="#fff" />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                    
                    <Text style={styles.membersLabel}>Гишүүд ({members.length}):</Text>
                    <FlatList
                        data={members}
                        keyExtractor={(item) => item.uid}
                        renderItem={renderMemberItem}
                        style={styles.membersList}
                        showsVerticalScrollIndicator={false}
                    />
                </View>
            ) : (
                <View style={styles.noGroupContainer}>
                    <Ionicons name="people-outline" size={80} color="#6c757d" />
                    <Text style={styles.noGroupTitle}>Гэр бүлийн группт нэгдээгүй байна</Text>
                    <Text style={styles.noGroupSubtitle}>Шинэ групп үүсгэх эсвэл урилгын кодоор нэгдэнэ үү</Text>
                    
                    <View style={styles.actionButtons}>
                        <TouchableOpacity 
                            style={[styles.actionButton, styles.createButton]}
                            onPress={() => setIsCreateModalVisible(true)}
                        >
                            <Ionicons name="add-circle-outline" size={24} color="#fff" />
                            <Text style={styles.actionButtonText}>Групп Үүсгэх</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[styles.actionButton, styles.joinButton]}
                            onPress={() => setIsJoinModalVisible(true)}
                        >
                            <Ionicons name="enter-outline" size={24} color="#fff" />
                            <Text style={styles.actionButtonText}>Группт Нэгдэх</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <Modal visible={isCreateModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Шинэ Групп Үүсгэх</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Группийн нэр (жнь: Ганзоригийн Гэр Бүл)"
                            value={groupName}
                            onChangeText={setGroupName}
                            editable={!isCreating}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setIsCreateModalVisible(false)}
                                disabled={isCreating}
                            >
                                <Text style={styles.cancelButtonText}>Буцах</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={createNewFamilyGroup}
                                disabled={isCreating}
                            >
                                {isCreating ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.confirmButtonText}>Үүсгэх</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={isJoinModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Группт Нэгдэх</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Урилгын код (жнь: FMLY-ABC123)"
                            value={inviteCode}
                            onChangeText={setInviteCode}
                            editable={!isJoining}
                            autoCapitalize="characters"
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setIsJoinModalVisible(false)}
                                disabled={isJoining}
                            >
                                <Text style={styles.cancelButtonText}>Буцах</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={joinFamilyGroup}
                                disabled={isJoining}
                            >
                                {isJoining ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.confirmButtonText}>Нэгдэх</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            
            {showSuccess && (
                <View style={sharedStyles.successOverlay}>
                    <View style={sharedStyles.successContent}>
                        <Ionicons name="checkmark-circle" size={60} color="#28a745" />
                        <Text style={sharedStyles.successText}>{successMessage}</Text>
                    </View>
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f7f6',
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#6c757d',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#343a40',
        marginBottom: 20,
    },
    groupCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    groupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    groupName: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 10,
        color: '#343a40',
    },
    groupInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        padding: 10,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
    },
    inviteCodeLabel: {
        fontSize: 14,
        color: '#6c757d',
        marginRight: 10,
    },
    inviteCodeText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#007bff',
    },
    roleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        padding: 10,
        backgroundColor: '#e3f2fd',
        borderRadius: 8,
    },
    roleLabel: {
        fontSize: 14,
        color: '#6c757d',
        marginRight: 10,
    },
    roleText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#007bff',
    },
    adminRole: {
        color: '#28a745',
    },
    inviteSection: {
        marginBottom: 20,
        padding: 15,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#343a40',
    },
    inviteRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    inviteInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ced4da',
        borderRadius: 8,
        padding: 10,
        fontSize: 14,
        marginRight: 10,
        backgroundColor: '#fff',
    },
    inviteBtn: {
        backgroundColor: '#28a745',
        padding: 10,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        width: 45,
    },
    membersLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#343a40',
    },
    membersList: {
        maxHeight: 300,
    },
    memberCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        marginBottom: 8,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#007bff',
    },
    memberInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    memberDetails: {
        marginLeft: 12,
        flex: 1,
    },
    memberName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#343a40',
    },
    memberEmail: {
        fontSize: 12,
        color: '#6c757d',
        marginTop: 2,
    },
    memberRole: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#007bff',
        marginTop: 2,
    },
    memberActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionBtn: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginLeft: 5,
        minWidth: 50,
        alignItems: 'center',
    },
    roleBtn: {
        backgroundColor: '#ffc107',
    },
    removeBtn: {
        backgroundColor: '#dc3545',
    },
    actionBtnText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#343a40',
    },
    noGroupContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noGroupTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#343a40',
        marginTop: 20,
        textAlign: 'center',
    },
    noGroupSubtitle: {
        fontSize: 14,
        color: '#6c757d',
        marginTop: 10,
        textAlign: 'center',
        marginBottom: 30,
    },
    actionButtons: {
        width: '100%',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
    },
    createButton: {
        backgroundColor: '#28a745',
    },
    joinButton: {
        backgroundColor: '#007bff',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        width: '90%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
        color: '#343a40',
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#ced4da',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    cancelButton: {
        backgroundColor: '#6c757d',
    },
    confirmButton: {
        backgroundColor: '#007bff',
    },
    cancelButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    confirmButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default FamilyGroupScreen;